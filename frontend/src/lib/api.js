import { axiosInstance } from "./axios";
import socket from './socket';

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  // Clear any existing Stream data to start fresh
  try {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('stream') || key.includes('chat')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('stream') || key.includes('chat')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Try to clear IndexedDB
    ['stream-chat-cache', 'stream-chat-persistence'].forEach(dbName => {
      try {
        const req = window.indexedDB.deleteDatabase(dbName);
      } catch (e) {}
    });
  } catch (e) {
    console.log("Error cleaning up before login:", e);
  }
  
  const response = await axiosInstance.post("/auth/login", loginData);
  
  // On successful login, force a fresh state
  if (response.data && response.data.user) {
    console.log("Login successful, will reload page for fresh state");
    // Allow a moment for the response to be processed
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }
  
  return response.data;
};

export const logout = async () => {
  // Disconnect socket
  if (socket.connected) {
    socket.disconnect();
  }

  // More aggressive cleanup of Stream data
  try {
    // Force disconnect any active Stream clients
    if (window.StreamChat && window.StreamChat._instances) {
      const instances = Object.values(window.StreamChat._instances);
      for (const client of instances) {
        try {
          if (client && typeof client.disconnectUser === 'function') {
            await client.disconnectUser();
            console.log("Forcefully disconnected Stream client");
          }
        } catch (e) {
          console.log("Error disconnecting client:", e);
        }
      }
      // Try to clear the instances object
      window.StreamChat._instances = {};
    }
    
    // Clear all Stream-related cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('stream') || name.includes('chat')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (
        key.includes('stream') || 
        key.includes('chat') || 
        key.includes('lp_') ||
        key.includes('token')
      ) {
        console.log("Clearing localStorage key:", key);
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (
        key.includes('stream') || 
        key.includes('chat') || 
        key.includes('token')
      ) {
        console.log("Clearing sessionStorage key:", key);
        sessionStorage.removeItem(key);
      }
    });
    
    // Try to clear IndexedDB
    const clearIndexedDB = async () => {
      if (!window.indexedDB) return;
      
      // Common IndexedDB names used by Stream
      const dbNames = ['stream-chat-cache', 'stream-chat-persistence'];
      
      for (const dbName of dbNames) {
        try {
          const deleteRequest = window.indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = () => console.log(`IndexedDB ${dbName} deleted`);
          deleteRequest.onerror = () => console.log(`Error deleting IndexedDB ${dbName}`);
        } catch (e) {
          console.log(`Error attempting to delete IndexedDB ${dbName}:`, e);
        }
      }
    };
    
    await clearIndexedDB();
    
  } catch (e) {
    console.error("Error during Stream cleanup:", e);
  }

  const response = await axiosInstance.post("/auth/logout");
  
  // Force page reload after logout to ensure clean state
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
  
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function rejectFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}/reject`);
  return response.data;
}

export async function removeFriend(friendId) {
  const response = await axiosInstance.delete(`/users/friends/${friendId}`);
  return response.data;
}

export async function cancelFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}/cancel`);
  return response.data;
}

// Chat endpoints (now using Express backend)
export async function getChatToken() {
  try {
    // Retry pattern for network issues
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        console.log(`Fetching chat token, attempt ${4-retries}`);
        const response = await axiosInstance.get("/chat/token"); 
        console.log("Chat token fetched successfully");
        return response.data;
      } catch (error) {
        lastError = error;
        if (error.response && error.response.status === 401) {
          // If unauthorized, no point in retrying
          console.error("Unauthorized when fetching chat token:", error);
          throw error;
        }
        
        console.warn(`Chat token fetch failed, retries left: ${retries-1}`, error);
        retries--;
        
        if (retries > 0) {
          // Wait before retrying (500ms, 1s, 2s)
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 500));
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error("Failed to fetch chat token after multiple attempts");
  } catch (error) {
    console.error("Error fetching chat token:", error);
    
    // Check if this is an unauthorized error
    if (error.response && error.response.status === 401) {
      // Clear any stale tokens that might be causing issues
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // Force a page refresh to go to login if needed
      if (window.location.pathname !== '/login') {
        setTimeout(() => {
          window.location.href = '/login?error=session_expired';
        }, 100);
      }
    }
    
    throw error;
  }
}

// Save message using Express backend
export async function saveMessage(messageData) {
  const response = await axiosInstance.post("/chat/messages", messageData);
  return response.data;
}

// For video calls - still use Express backend until moved to Go
export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

// Helper function to forcefully clean up Stream chat instances (can be called on navigation)
export const abortChatConnection = () => {
  console.log("Forcefully aborting and cleaning up all chat connections");
  try {
    // Clean up Stream client instances if they exist
    if (window.StreamChat && window.StreamChat._instances) {
      const instances = Object.values(window.StreamChat._instances);
      console.log(`Found ${instances.length} Stream chat instances to clean up`);
      
      instances.forEach(client => {
        try {
          if (client && typeof client.disconnectUser === 'function') {
            client.disconnectUser().catch(e => console.log("Error in disconnect:", e));
            console.log("Forcefully disconnected a Stream client instance");
          }
        } catch (e) {
          console.log("Error disconnecting client instance:", e);
        }
      });
      
      // Reset the instances
      window.StreamChat._instances = {};
    }
    
    // Clean up localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('stream-chat-') || key.includes('str:chat:')) {
        try {
          localStorage.removeItem(key);
          console.log(`Removed problematic localStorage key: ${key}`);
        } catch (e) {
          console.log(`Error removing item: ${key}`, e);
        }
      }
    });
    
    // Clean up IndexedDB if available
    if (window.indexedDB) {
      ['stream-chat-cache', 'stream-chat-persistence', 'stream-chat-storage'].forEach(dbName => {
        try {
          const req = window.indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => console.log(`Successfully deleted ${dbName}`);
          req.onerror = (event) => console.log(`Error deleting ${dbName}:`, event);
        } catch (e) {
          console.log(`Error trying to delete ${dbName}:`, e);
        }
      });
    }
    
    return true;
  } catch (err) {
    console.error("Error in aborting chat connection:", err);
    return false;
  }
};
