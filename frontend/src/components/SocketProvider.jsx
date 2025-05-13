import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import socket from '../lib/socket';
import { useNotificationStore } from '../store/useNotificationStore';
import useAuthUser from '../hooks/useAuthUser';
import { useQueryClient } from '@tanstack/react-query';

// Hàm định dạng timestamp đơn giản không dùng thư viện
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Vừa xong';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

export default function SocketProvider({ children }) {
  const { authUser } = useAuthUser();
  const { addFriendRequest, addAcceptedRequest } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authUser) return;

    // Only connect if not already connected
    if (!socket.connected) {
      console.log("Socket connecting...");
      socket.connect();
      
      // Register user to socket after connection
      socket.on('connect', () => {
        console.log(`Socket connected, registering user: ${authUser._id}`);
        socket.emit('register', authUser._id);
      });
    } else {
      // If already connected, just make sure user is registered
      console.log(`Socket already connected, registering user: ${authUser._id}`);
      socket.emit('register', authUser._id);
    }

    // Listen for friend request notifications
    const handleFriendRequest = (data) => {
      console.log('Friend request received:', data);
      
      // Add to notification store
      addFriendRequest(data);
      
      // Show toast notification without View button
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-base-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-full p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src={data.sender.profilePic} alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {data.sender.fullName}
                </p>
                <p className="mt-1 text-sm">
                  Sent you a friend request
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 3000 });
    };

    // Listen for friend request accepted notifications
    const handleFriendRequestAccepted = (data) => {
      console.log('Friend request accepted:', data);
      
      // Add to notification store
      addAcceptedRequest(data);
      
      // Update the friends list in real-time when someone accepts your friend request
      const currentFriends = queryClient.getQueryData(["friends"]) || [];
      
      // Check if the friend is already in the list
      const friendExists = currentFriends.some(friend => friend._id === data.recipient._id);
      
      // Only add if not already in friends list
      if (!friendExists) {
        // Add the new friend to the friends list cache
        queryClient.setQueryData(["friends"], [
          ...currentFriends,
          {
            _id: data.recipient._id,
            fullName: data.recipient.fullName,
            profilePic: data.recipient.profilePic,
            nativeLanguage: data.recipient.nativeLanguage,
            learningLanguage: data.recipient.learningLanguage
          }
        ]);
        
        // Invalidate the query to fetch complete friend data
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      }
      
      // Show toast notification without extra button
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-base-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-full p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src={data.recipient.profilePic} alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {data.recipient.fullName}
                </p>
                <p className="mt-1 text-sm">
                  Accepted your friend request
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 3000 });
    };

    // Listen for unfriend notifications
    const handleUnfriended = (data) => {
      console.log('Unfriended notification received in SocketProvider:', data);
      
      try {
        if (!data || !data.userId) {
          console.error("Invalid unfriend data received:", data);
          return;
        }
        
        // Immediately invalidate all relevant queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        
        // Also clear entries from cache
        const currentFriends = queryClient.getQueryData(["friends"]);
        if (currentFriends) {
          // Filter out the user who unfriended from the friends list
          const updatedFriends = currentFriends.filter(friend => friend._id !== data.userId);
          queryClient.setQueryData(["friends"], updatedFriends);
        }
        
        // Clear any outgoing requests to this user
        const outgoingReqs = queryClient.getQueryData(["outgoingFriendReqs"]);
        if (outgoingReqs) {
          const updatedOutgoing = outgoingReqs.filter(req => req.recipient._id !== data.userId);
          queryClient.setQueryData(["outgoingFriendReqs"], updatedOutgoing);
        }
        
        // Show toast notification
        if (data.user) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-base-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-full p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <img className="h-10 w-10 rounded-full" src={data.user.profilePic} alt="" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">Friend connection ended</p>
                    <p className="mt-1 text-sm">
                      {data.user.fullName} is no longer your friend
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ), { duration: 3000 });
        }
        
        // Force refetch after a delay to ensure fresh data
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["friends"] });
          queryClient.refetchQueries({ queryKey: ["outgoingFriendReqs"] });
          queryClient.refetchQueries({ queryKey: ["users"] });
        }, 300);
        
      } catch (error) {
        console.error("Error handling unfriend event:", error);
        // Just refetch anyway if something goes wrong
        queryClient.refetchQueries({ queryKey: ["friends"] });
        queryClient.refetchQueries({ queryKey: ["outgoingFriendReqs"] });
        queryClient.refetchQueries({ queryKey: ["users"] });
      }
    };

    // Listen for friend request canceled events
    const handleFriendRequestCanceled = (data) => {
      console.log('Friend request canceled:', data);
      
      // Show toast notification
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-base-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-full p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src={data.sender.profilePic} alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {data.sender.fullName}
                </p>
                <p className="mt-1 text-sm">
                  Canceled their friend request
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 3000 });
      
      // Update the friend requests list in real-time
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    };

    console.log("SocketProvider: Registering socket event listeners");
    socket.on('friendRequest', handleFriendRequest);
    socket.on('friendRequestAccepted', handleFriendRequestAccepted);
    socket.on('unfriended', handleUnfriended);
    socket.on('friendRequestCanceled', handleFriendRequestCanceled);

    // Cleanup on unmount
    return () => {
      console.log("SocketProvider: Removing socket event listeners");
      socket.off('friendRequest', handleFriendRequest);
      socket.off('friendRequestAccepted', handleFriendRequestAccepted);
      socket.off('unfriended', handleUnfriended);
      socket.off('friendRequestCanceled', handleFriendRequestCanceled);
      socket.off('connect');
      
      // No need to disconnect as this component should be present for the entire app lifetime
      // If you need to disconnect when the user logs out, handle that in logout logic
    };
  }, [authUser, addFriendRequest, addAcceptedRequest, queryClient]);

  return children;
} 