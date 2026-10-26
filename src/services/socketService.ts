
import { io } from "socket.io-client";
import { API_URL } from "@/constants/config";

export const socket = io(API_URL, {
  autoConnect: false,
});
