import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { io, connectedUsers } from "../server.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends && recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    const currentUser = await User.findById(myId);
    if (currentUser.friends && currentUser.friends.includes(recipientId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId, status: "pending" },
        { sender: recipientId, recipient: myId, status: "pending" },
      ],
    });

    if (existingRequest) {
      if (existingRequest.sender.toString() === myId) {
        return res.status(400).json({ 
          message: "You have already sent a friend request to this user",
          requestId: existingRequest._id
        });
      } else {
        return res.status(400).json({ 
          message: "This user has already sent you a friend request", 
          requestId: existingRequest._id
        });
      }
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    // Get the sender's info to include in the notification
    const sender = await User.findById(myId).select("fullName profilePic");

    // Check if recipient is connected via socket
    const recipientSocketId = connectedUsers.get(recipientId);
    if (recipientSocketId) {
      // Send real-time notification to recipient with timestamp
      io.to(recipientSocketId).emit("friendRequest", {
        requestId: friendRequest._id,
        sender: {
          _id: myId,
          fullName: sender.fullName,
          profilePic: sender.profilePic
        },
        timestamp: friendRequest.createdAt || new Date(),
      });
      console.log(`Emitted friend request notification to ${recipientId}`);
    } else {
      console.log(`User ${recipientId} is not connected, notification will be seen on refresh`);
    }

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Get the recipient's info to include in the notification with more fields
    const recipient = await User.findById(req.user.id).select("fullName profilePic nativeLanguage learningLanguage");

    // Check if sender is connected via socket
    const senderSocketId = connectedUsers.get(friendRequest.sender.toString());
    if (senderSocketId) {
      // Send real-time notification to sender that their request was accepted with timestamp
      io.to(senderSocketId).emit("friendRequestAccepted", {
        requestId: friendRequest._id,
        recipient: {
          _id: req.user.id,
          fullName: recipient.fullName,
          profilePic: recipient.profilePic,
          nativeLanguage: recipient.nativeLanguage,
          learningLanguage: recipient.learningLanguage
        },
        timestamp: friendRequest.updatedAt || new Date(),
      });
      console.log(`Emitted friend request accepted notification to ${friendRequest.sender}`);
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    // Delete the friend request instead of changing status
    await FriendRequest.findByIdAndDelete(requestId);

    // Check if sender is connected via socket
    const senderSocketId = connectedUsers.get(friendRequest.sender.toString());
    if (senderSocketId) {
      // Optionally notify the sender that their request was rejected
      // For now, we don't notify to avoid negative feelings
      console.log(`User ${friendRequest.sender} friend request was rejected`);
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeFriend(req, res) {
  try {
    const currentUserId = req.user.id;
    const { id: friendId } = req.params;

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get info about both users before removing the connection
    const currentUser = await User.findById(currentUserId).select("fullName profilePic");
    const friendUser = await User.findById(friendId).select("fullName profilePic");

    // Remove each user from the other's friends array
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId },
    });

    // Also remove any pending friend requests between these users
    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUserId, recipient: friendId },
        { sender: friendId, recipient: currentUserId }
      ]
    });

    // Emit unfriend events to both users for consistent real-time updates
    
    // 1. Notify the friend that they were unfriended
    const friendSocketId = connectedUsers.get(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("unfriended", {
        userId: currentUserId,
        user: {
          _id: currentUserId,
          fullName: currentUser.fullName,
          profilePic: currentUser.profilePic
        },
        timestamp: new Date(),
      });
      console.log(`Emitted unfriend notification to ${friendId}`);
    }
    
    // 2. Also notify the current user for UI consistency
    const currentUserSocketId = connectedUsers.get(currentUserId);
    if (currentUserSocketId) {
      io.to(currentUserSocketId).emit("unfriended", {
        userId: friendId,
        user: {
          _id: friendId,
          fullName: friendUser.fullName,
          profilePic: friendUser.profilePic
        },
        timestamp: new Date(),
      });
      console.log(`Emitted unfriend notification to ${currentUserId} (sender)`);
    }

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.log("Error in removeFriend controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const currentUserId = req.user.id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the sender
    if (friendRequest.sender.toString() !== currentUserId) {
      return res.status(403).json({ message: "You are not authorized to cancel this request" });
    }

    // Get information about both users for notification
    const sender = await User.findById(currentUserId).select("fullName profilePic");
    const recipient = await User.findById(friendRequest.recipient).select("fullName profilePic");

    // Delete the friend request
    await FriendRequest.findByIdAndDelete(requestId);

    // Notify recipient that request was canceled if they're online
    const recipientSocketId = connectedUsers.get(friendRequest.recipient.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequestCanceled", {
        requestId: friendRequest._id,
        sender: {
          _id: currentUserId,
          fullName: sender.fullName,
          profilePic: sender.profilePic
        },
        timestamp: new Date(),
      });
      console.log(`Emitted friend request canceled notification to ${friendRequest.recipient}`);
    }

    res.status(200).json({ message: "Friend request canceled" });
  } catch (error) {
    console.log("Error in cancelFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
