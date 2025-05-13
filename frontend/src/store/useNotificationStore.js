import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      friendRequests: [],
      acceptedRequests: [],
      hasNewNotifications: false,
      
      // Add a new friend request notification
      addFriendRequest: (request) => {
        const existingRequests = get().friendRequests;
        
        // Check if the request already exists
        const exists = existingRequests.some(req => req.requestId === request.requestId);
        
        if (!exists) {
          set({
            friendRequests: [{
              ...request,
              createdAt: request.timestamp || new Date().toISOString(),
              read: false
            }, ...existingRequests],
            hasNewNotifications: true,
          });
        }
      },
      
      // Add a new friend request accepted notification
      addAcceptedRequest: (request) => {
        const existingAccepted = get().acceptedRequests;
        
        // Check if the accepted request already exists
        const exists = existingAccepted.some(req => req.requestId === request.requestId);
        
        if (!exists) {
          set({
            acceptedRequests: [{
              ...request,
              updatedAt: request.timestamp || new Date().toISOString(),
              read: false
            }, ...existingAccepted],
            hasNewNotifications: true,
          });
        }
      },
      
      // Mark all notifications as read
      markAsRead: () => {
        set({
          hasNewNotifications: false,
          friendRequests: get().friendRequests.map(req => ({ ...req, read: true })),
          acceptedRequests: get().acceptedRequests.map(req => ({ ...req, read: true })),
        });
      },
      
      // Set notifications from the API
      setNotifications: (friendRequests, acceptedRequests) => {
        set({
          // Sort by timestamp, most recent first
          friendRequests: friendRequests.sort((a, b) => 
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
          acceptedRequests: acceptedRequests.sort((a, b) => 
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
        });
      },
      
      // Clear all notifications
      clearNotifications: () => set({ friendRequests: [], acceptedRequests: [] }),
    }),
    {
      name: 'notifications-storage', // name for localStorage
      partialize: (state) => ({
        friendRequests: state.friendRequests,
        acceptedRequests: state.acceptedRequests,
        hasNewNotifications: state.hasNewNotifications,
      }),
    }
  )
); 