import { io } from 'socket.io-client';

// Create a single socket instance with better debugging
const EXPRESS_SOCKET_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5001" 
  : window.location.origin;

console.log("Socket connecting to:", EXPRESS_SOCKET_URL);

const socket = io(EXPRESS_SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5, 
  reconnectionDelay: 1000,
  withCredentials: true,  // Needed for cookies/authentication
});

// Add debugging listeners
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`Socket reconnection attempt: ${attemptNumber}`);
});

export default socket; 