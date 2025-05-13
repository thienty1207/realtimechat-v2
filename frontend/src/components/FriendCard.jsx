import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeFriend } from "../lib/api";
import { UserMinus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const FriendCard = ({ friend }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: unfriendMutation, isPending } = useMutation({
    mutationFn: removeFriend,
    onMutate: async (friendId) => {
      await queryClient.cancelQueries({ queryKey: ["friends"] });
      
      const previousFriends = queryClient.getQueryData(["friends"]);
      
      if (previousFriends) {
        queryClient.setQueryData(["friends"], 
          previousFriends.filter(f => f._id !== friendId)
        );
      }
      
      return { previousFriends };
    },
    onError: (err, friendId, context) => {
      if (context?.previousFriends) {
        queryClient.setQueryData(["friends"], context.previousFriends);
      }
      toast.error("Failed to remove friend");
      setShowConfirm(false);
    },
    onSuccess: () => {
      toast.success("Friend removed successfully");
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const handleUnfriend = () => {
    if (showConfirm) {
      unfriendMutation(friend._id);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-12 h-12 rounded-full">
              <img src={friend.profilePic} alt={friend.fullName} />
            </div>
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <div className="flex gap-2">
          <Link to={`/chat/${friend._id}`} className="btn btn-outline flex-1">
            Message
          </Link>
          
          <button 
            className={`btn ${showConfirm ? 'btn-error' : 'btn-outline btn-error'}`}
            onClick={handleUnfriend}
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <UserMinus size={18} />
            )}
            {showConfirm ? 'Confirm' : ''}
          </button>
        </div>
        
        {showConfirm && (
          <div className="mt-2 text-sm text-error">
            Click again to confirm unfriending
          </div>
        )}
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
