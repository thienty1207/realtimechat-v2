import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, MessageSquareIcon, UserCheckIcon, UserMinusIcon, UserPlusIcon, UsersIcon, XCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import socket from '../lib/socket';

import { capitialize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [outgoingRequestsMap, setOutgoingRequestsMap] = useState(new Map());
  const [incomingRequestsMap, setIncomingRequestsMap] = useState(new Map());
  const [friendIds, setFriendIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // Listen for unfriend events directly on this page to ensure immediate UI updates
  useEffect(() => {
    // Avoid re-registering the callback on every render
    const handleUnfriendedEvent = (data) => {
      console.log("Unfriend event received in HomePage:", data);
      
      if (!data || !data.userId) {
        console.error("Invalid unfriend data received:", data);
        return;
      }

      try {
        // Get the unfriended user's ID
        const unfriendedUserId = data.userId;
        
        // Immediately update local state for immediate feedback
        setFriendIds(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(unfriendedUserId);
          return newSet;
        });
        
        setOutgoingRequestsIds(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(unfriendedUserId);
          return newSet;
        });
        
        // Invalidate queries but don't force refreshes (SocketProvider will handle that)
        queryClient.invalidateQueries(["friends"]);
        queryClient.invalidateQueries(["users"]);
        queryClient.invalidateQueries(["outgoingFriendReqs"]);
      } catch (error) {
        console.error("Error handling unfriend event in HomePage:", error);
      }
    };
    
    // Only register the event if socket exists
    if (socket) {
      console.log("HomePage: Registering unfriended event listener");
      socket.on("unfriended", handleUnfriendedEvent);
      
      return () => {
        console.log("HomePage: Removing unfriended event listener");
        socket.off("unfriended", handleUnfriendedEvent);
      };
    }
    
    return () => {};
  }, [queryClient]);

  // Keep track of current friends' IDs
  useEffect(() => {
    const ids = new Set();
    if (friends && friends.length > 0) {
      friends.forEach(friend => {
        ids.add(friend._id);
      });
      setFriendIds(ids);
    }
  }, [friends]);

  const { mutate: sendRequestMutation, isPending: isSendingRequest } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      toast.success("Friend request sent successfully");
    },
    onError: (error) => {
      console.error("Error sending friend request:", error);
      // Handle specific error messages from backend
      const errorMessage = error.response?.data?.message || "Failed to send friend request";
      
      // If the user has already sent us a request, show a helpful message
      if (errorMessage.includes("already sent you a friend request")) {
        toast.error(errorMessage + ". Check your notifications to accept it!");
      } else {
        toast.error(errorMessage);
      }
    }
  });

  // Add mutation for canceling a friend request
  const { mutate: cancelRequestMutation, isPending: isCancelingRequest } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      
      // Update local state immediately for better UX
      setOutgoingRequestsIds(prev => {
        const newSet = new Set([...prev]);
        // Get the recipient ID from our map
        const request = outgoingRequestsMap.get(requestId);
        if (request) {
          newSet.delete(request.recipient._id);
        }
        return newSet;
      });
      
      // Also update the map
      setOutgoingRequestsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
      
      toast.success("Friend request canceled");
    },
    onError: (error) => {
      console.error("Error canceling friend request:", error);
      toast.error(error.response?.data?.message || "Failed to cancel friend request");
    }
  });

  const { mutate: acceptRequestMutation, isPending: isAcceptingRequest } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  useEffect(() => {
    const outgoingIds = new Set();
    const outgoingMap = new Map();
    
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
        outgoingMap.set(req._id, req); // Save the full request object with _id as key
      });
      setOutgoingRequestsIds(outgoingIds);
      setOutgoingRequestsMap(outgoingMap);
    }
  }, [outgoingFriendReqs]);

  useEffect(() => {
    const incomingReqsMap = new Map();
    if (friendRequests && friendRequests.incomingReqs && friendRequests.incomingReqs.length > 0) {
      friendRequests.incomingReqs.forEach((req) => {
        incomingReqsMap.set(req.sender._id, req._id);
      });
      setIncomingRequestsMap(incomingReqsMap);
    }
  }, [friendRequests]);

  // Filter out recommended users who are already friends
  const filteredRecommendedUsers = useMemo(() => {
    if (!recommendedUsers) return [];
    return recommendedUsers.filter(user => !friendIds.has(user._id));
  }, [recommendedUsers, friendIds]);

  // Function to find the outgoing request ID for a user
  const getOutgoingRequestId = useCallback((userId) => {
    for (const [requestId, request] of outgoingRequestsMap.entries()) {
      if (request.recipient._id === userId) {
        return requestId;
      }
    }
    return null;
  }, [outgoingRequestsMap]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meet New Learners</h2>
                <p className="opacity-70">
                  Discover perfect language exchange partners based on your profile
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredRecommendedUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">No recommendations available</h3>
              <p className="text-base-content opacity-70">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendedUsers.map((user) => {
                const hasOutgoingRequest = outgoingRequestsIds.has(user._id);
                const outgoingRequestId = hasOutgoingRequest ? getOutgoingRequestId(user._id) : null;
                const hasIncomingRequest = incomingRequestsMap.has(user._id);
                const incomingRequestId = hasIncomingRequest ? incomingRequestsMap.get(user._id) : null;
                const isFriend = friendIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-full">
                            <img src={user.profilePic} alt={user.fullName} />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages with flags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Action button */}
                      {isFriend ? (
                        <Link to={`/chat/${user._id}`} className="btn btn-success w-full mt-2">
                          <MessageSquareIcon className="size-4 mr-2" />
                          Message
                        </Link>
                      ) : hasIncomingRequest ? (
                        <button
                          className="btn btn-success w-full mt-2"
                          onClick={() => acceptRequestMutation(incomingRequestId)}
                          disabled={isAcceptingRequest}
                        >
                          <UserCheckIcon className="size-4 mr-2" />
                          Accept Invite
                        </button>
                      ) : hasOutgoingRequest ? (
                        <button
                          className="btn btn-warning w-full mt-2"
                          onClick={() => cancelRequestMutation(outgoingRequestId)}
                          disabled={isCancelingRequest}
                        >
                          <XCircleIcon className="size-4 mr-2" />
                          Cancel Request
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary w-full mt-2"
                          onClick={() => sendRequestMutation(user._id)}
                          disabled={isSendingRequest}
                        >
                          <UserPlusIcon className="size-4 mr-2" />
                          Send Friend Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
