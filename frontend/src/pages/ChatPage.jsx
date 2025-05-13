import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getChatToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Add utility function to force cleanup Stream chat instances
const forceCleanupStreamInstances = () => {
  try {
    if (window.StreamChat && window.StreamChat._instances) {
      const instances = Object.values(window.StreamChat._instances);
      console.log(`Found ${instances.length} Stream chat instances to clean up`);
      
      // Force all instances to disconnect and cleanup
      for (const client of instances) {
        try {
          if (client && typeof client.disconnectUser === 'function') {
            client.disconnectUser().catch(e => console.log("Error in disconnect:", e));
            console.log("Forcefully disconnected a Stream client instance");
          }
        } catch (e) {
          console.log("Error disconnecting client instance:", e);
        }
      }
      
      // Clear the instances directly
      window.StreamChat._instances = {};
    }
    
    // Remove any stale data from localStorage that might be interfering
    Object.keys(localStorage).forEach(key => {
      if (key.includes('stream-chat-') || key.includes('str:chat:')) {
        localStorage.removeItem(key);
        console.log(`Removed potentially problematic localStorage key: ${key}`);
      }
    });
  } catch (err) {
    console.error("Error in force cleanup:", err);
  }
};

// Reset any IndexedDB databases that might be causing issues
const resetIndexedDBs = () => {
  try {
    ['stream-chat-cache', 'stream-chat-persistence', 'stream-chat-storage'].forEach(dbName => {
      try {
        console.log(`Attempting to delete IndexedDB: ${dbName}`);
        const req = window.indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => console.log(`Successfully deleted ${dbName}`);
        req.onerror = (event) => console.error(`Error deleting ${dbName}:`, event);
      } catch (e) {
        console.error(`Error trying to delete ${dbName}:`, e);
      }
    });
  } catch (e) {
    console.error("Error cleaning IndexedDB:", e);
  }
};

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const clientRef = useRef(null);

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [errorState, setErrorState] = useState(null);

  const { authUser } = useAuthUser();

  // Use refetchOnWindowFocus to ensure tokens are fresh when tab is focused
  const { data: tokenData, refetch: refetchToken } = useQuery({
    queryKey: ["chatToken", authUser?._id], // Include user ID in key to refetch when user changes
    queryFn: getChatToken,
    enabled: !!authUser,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Use a unique identifier for this chat instance
  const chatInstanceId = useRef(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Listen for visibility changes to reinitialize when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !chatClient) {
        console.log("Page became visible, reloading chat...");
        refetchToken();
        setRetryCount(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatClient, refetchToken]);

  // Add additional cleanup on component mount
  useEffect(() => {
    console.log("ChatPage mounted, performing initial cleanup");
    
    // Do a thorough cleanup on mount
    resetIndexedDBs();
    forceCleanupStreamInstances();

    return () => {
      console.log("ChatPage unmounting, performing final cleanup");
      if (clientRef.current) {
        try {
          console.log("Disconnecting client on unmount");
          clientRef.current.disconnectUser().catch(e => console.log("Error on final disconnect:", e));
          clientRef.current = null;
        } catch (e) {
          console.error("Error disconnecting on final cleanup:", e);
        }
      }
      forceCleanupStreamInstances();
    };
  }, []);  // Empty dependency array for component mount/unmount only

  // Initialize chat when token and user are available
  useEffect(() => {
    // Ensure both authUser and its _id are present, and tokenData and its token are present
    if (!authUser || !authUser._id || !tokenData || !tokenData.token) {
      console.log("ChatPage: Missing critical authUser info or tokenData. Waiting or refetching...");
      // If authUser is present but token is missing, try refetching token
      if (authUser && !tokenData?.token) {
        refetchToken();
      }
      setLoading(true); // Keep loading indicator if data is missing
      return;
    }

    // Initialize or re-initialize the chat
    const initChat = async () => {
      console.log("ChatPage: initChat called. User:", authUser._id, "Token available:", !!tokenData.token);
      setErrorState(null);
      setLoading(true);
      
      // Aggressive cleanup before any new connection attempt
      console.log("ChatPage: Performing pre-init cleanup...");
      resetIndexedDBs();
      forceCleanupStreamInstances();
      if (clientRef.current) {
        try {
          console.log("ChatPage: Disconnecting existing client before new init");
          await clientRef.current.disconnectUser();
        } catch (err) {
          console.warn("ChatPage: Error disconnecting existing client in initChat:", err.message);
        } finally {
          clientRef.current = null; // Ensure clientRef is nullified
        }
      }

      // Delay slightly to ensure cleanup operations complete and UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); 

      try {
        console.log("ChatPage: Initializing Stream chat client with fresh token...");
        
        const client = new StreamChat(STREAM_API_KEY, {
          timeout: 10000,
          enableWSFallback: true, 
          enableInsights: false, 
          allowServerSideConnect: true, 
          // Removed allowMultipleInstances: false as it might cause issues with quick reconnects
          // Removed baseURL as default should work or be configured via Stream dashboard
        });

        clientRef.current = client;
        
        console.log(`ChatPage: Connecting user ${authUser._id} with name '${authUser.fullName}'`);
        
        const userToConnect = {
          id: authUser._id.toString(), // Ensure it's a string
          name: authUser.fullName || authUser.username || "Anonymous", // Provide a fallback name
          image: authUser.profilePic,
          // Add any other custom fields Stream might expect, if any
          // e.g., role: 'user'
        };
        
        // Log the user object being sent to Stream
        console.log("ChatPage: User object for connectUser:", JSON.stringify(userToConnect));

        await client.connectUser(userToConnect, tokenData.token);

        console.log("ChatPage: User connected successfully to Stream.");

        // Setup channel for the conversation
        const channelId = [authUser._id, targetUserId].sort().join("-");
        console.log(`ChatPage: Creating/getting channel: ${channelId}`);
        
        const currChannel = client.channel("messaging", channelId, {
          name: `Chat with ${targetUserId}`, // Optional: give the channel a name
          members: [authUser._id.toString(), targetUserId.toString()],
        });

        console.log("ChatPage: Watching channel...");
        await currChannel.watch();
        console.log("ChatPage: Channel watch successful.");

        setChatClient(client);
        setChannel(currChannel);
        setErrorState(null); // Clear any previous error

      } catch (error) {
        console.error("ChatPage: Error initializing chat:", error.message, error);
        let displayError = "Failed to connect to chat.";
        if (error.message && error.message.includes("user_details is a required field")) {
          displayError = "Chat service requires user details. Please ensure your profile is complete.";
        } else if (error.message && error.message.includes("token is invalid")) {
          displayError = "Your chat session token is invalid. Attempting to refresh.";
          refetchToken(); // Try to get a new token
        }
        
        setErrorState(displayError);
        
        if (clientRef.current) {
          try {
            await clientRef.current.disconnectUser();
          } catch (disconnectError) {
            console.warn("ChatPage: Error disconnecting client after init failure:", disconnectError.message);
          } finally {
            clientRef.current = null;
          }
        }
        
        toast.error(displayError + " Trying to reconnect...");
        
        if (retryCount < 3) {
          setTimeout(() => {
            console.log("ChatPage: Retrying chat initialization, attempt:", retryCount + 1);
            setRetryCount(prev => prev + 1);
            // Don't call refetchToken here if the error wasn't a token error, 
            // as connectUser itself will be retried with existing token.
          }, (retryCount + 1) * 2000); // Exponential backoff for retries
        } else {
          toast.error("Failed to connect to chat after multiple attempts. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup function for this effect
    return () => {
      console.log("ChatPage: useEffect [authUser, tokenData, targetUserId, retryCount] cleanup.");
      // No need to disconnect here as the main component unmount cleanup will handle it
      // or if initChat is called again, it handles its own cleanup.
    };
  }, [authUser, tokenData, targetUserId, retryCount, refetchToken]); // Added refetchToken to dependencies

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `/call/${channel.id}`;
      const fullCallUrl = `${window.location.origin}${callUrl}`;

      // Send message with call link
      channel.sendMessage({
        text: `I've started a video call. Join me here: ${fullCallUrl}`,
      });
      
      // Open call in a new tab
      window.open(fullCallUrl, '_blank');
    }
  };

  // Show appropriate UI based on state
  if (loading) {
    return <ChatLoader />;
  }

  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base-100">
        <div className="card w-full max-w-md bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-error">Chat Connection Error</h2>
            <p>{errorState}</p>
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  refetchToken();
                }}
              >
                Retry Connection
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => navigate('/home')}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (chatClient && channel) {
    return (
      <div className="h-[93vh]">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full relative">
              <CallButton handleVideoCall={handleVideoCall} />
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>
    );
  }

  return <ChatLoader />;
};

export default ChatPage;
