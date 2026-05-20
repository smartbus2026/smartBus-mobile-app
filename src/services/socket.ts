import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5001";

const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// Join the appropriate room based on stored user info
AsyncStorage.multiGet(["userId", "userRole"]).then(([userIdEntry, roleEntry]) => {
  const userId = userIdEntry[1];
  const role   = roleEntry[1];

  if (userId && role === "student") {
    socket.emit("join-user-room", userId);
  } else if (role === "admin") {
    socket.emit("join-admins");
  }
});

// Re-join rooms on reconnect
socket.on("connect", async () => {
  const [[, userId], [, role]] = await AsyncStorage.multiGet(["userId", "userRole"]);
  if (userId && role === "student") socket.emit("join-user-room", userId);
  if (role === "admin") socket.emit("join-admins");
});

export default socket;