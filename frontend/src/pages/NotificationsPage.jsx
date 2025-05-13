import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest } from "../lib/api";
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon, XIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { useNotificationStore } from "../store/useNotificationStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { 
    setNotifications, 
    markAsRead,
    hasNewNotifications
  } = useNotificationStore();
  
  // Local state to track processed requests for immediate UI updates
  const [processedRequestIds, setProcessedRequestIds] = useState(new Set());

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // Mark notifications as read when visiting this page
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Update the notification store with fetched data
  useEffect(() => {
    if (friendRequests) {
      setNotifications(friendRequests.incomingReqs || [], friendRequests.acceptedReqs || []);
    }
  }, [friendRequests, setNotifications]);

  const { mutate: acceptRequestMutation, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    // Use optimistic update to modify UI immediately before API call completes
    onMutate: async (requestId) => {
      // Add to processed set to hide from UI immediately
      setProcessedRequestIds(prev => new Set([...prev, requestId]));
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["friendRequests"] });
      
      // Get current data
      const previousData = queryClient.getQueryData(["friendRequests"]);
      
      // Optimistically update friendRequests
      if (previousData) {
        // Find the request being accepted
        const requestToAccept = previousData.incomingReqs.find(req => req._id === requestId);
        
        // Create a copy of the requests without the accepted one
        const updatedIncomingReqs = previousData.incomingReqs.filter(req => req._id !== requestId);
        
        // If we're accepting a request, update the accepted list
        if (requestToAccept) {
          // Get the current user data from the request
          const currentUser = queryClient.getQueryData(["authUser"])?.user;
          
          // Add to accepted requests list
          const updatedAcceptedReqs = [
            ...previousData.acceptedReqs, 
            {
              _id: requestId,
              sender: currentUser,
              recipient: requestToAccept.sender,
              status: "accepted"
            }
          ];
          
          // Update the query data
          queryClient.setQueryData(["friendRequests"], {
            ...previousData,
            incomingReqs: updatedIncomingReqs,
            acceptedReqs: updatedAcceptedReqs
          });
        }
      }
      
      return { previousData };
    },
    onError: (err, requestId, context) => {
      // On error, revert changes
      if (context?.previousData) {
        queryClient.setQueryData(["friendRequests"], context.previousData);
      }
      setProcessedRequestIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(requestId);
        return newSet;
      });
      toast.error("Failed to accept friend request");
    },
    onSuccess: () => {
      toast.success("Friend request accepted");
      // Still invalidate the queries to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: rejectRequestMutation, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    // Use optimistic update to modify UI immediately
    onMutate: async (requestId) => {
      // Add to processed set to hide from UI immediately
      setProcessedRequestIds(prev => new Set([...prev, requestId]));
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["friendRequests"] });
      
      // Get current data
      const previousData = queryClient.getQueryData(["friendRequests"]);
      
      // Optimistically update to remove the rejected request from UI
      if (previousData) {
        queryClient.setQueryData(["friendRequests"], {
          ...previousData,
          incomingReqs: previousData.incomingReqs.filter(req => req._id !== requestId),
        });
      }
      
      return { previousData };
    },
    onError: (err, requestId, context) => {
      // On error, revert changes
      if (context?.previousData) {
        queryClient.setQueryData(["friendRequests"], context.previousData);
      }
      setProcessedRequestIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(requestId);
        return newSet;
      });
      toast.error("Failed to decline friend request");
    },
    onSuccess: () => {
      toast.success("Friend request declined");
      // Still invalidate the query to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  // Filter out any requests that have been processed locally
  const incomingRequests = (friendRequests?.incomingReqs || [])
    .filter(request => !processedRequestIds.has(request._id));
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Native: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Learning: {request.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              className="btn btn-error btn-sm btn-outline"
                              onClick={() => rejectRequestMutation(request._id)}
                              disabled={isAccepting || isRejecting}
                            >
                              <XIcon className="h-4 w-4" />
                              Decline
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isAccepting || isRejecting}
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
