import { Server } from "socket.io";

let io: Server | null = null;

export const setSocketInstance = (socketInstance: Server) => {
  io = socketInstance;
};

export const getSocketInstance = (): Server | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  console.log("=== SOCKET SERVICE DEBUG ===");
  console.log("Attempting to emit to user:", userId);
  console.log("Event:", event);
  console.log("Data:", data);
  console.log("Socket IO instance available:", !!io);

  if (io) {
    const room = `user_${userId}`;
    console.log("Emitting to room:", room);
    io.to(room).emit(event, data);
    console.log("Socket emission completed");
  } else {
    console.error("Socket IO instance not available!");
  }
};
