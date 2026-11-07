import { io } from "socket.io-client";

const wsUrl = import.meta.env.VITE_WS_URL || "";
let socket;

function getSocket() {
  if (!wsUrl) return null;
  if (!socket) {
    socket = io(wsUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectSocket() {
  const client = getSocket();
  if (client && !client.connected) client.connect();
  return client;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

function subscribe(eventName, callback) {
  const client = getSocket();
  if (!client || typeof callback !== "function") return () => {};
  client.off(eventName, callback);
  client.on(eventName, callback);
  return () => client.off(eventName, callback);
}

export function subscribeToConnection(connectCallback, errorCallback) {
  const removeConnect = subscribe("connect", connectCallback);
  const removeError = subscribe("connect_error", errorCallback);
  return () => {
    removeConnect();
    removeError();
  };
}

export function toggleQna(lectureId, isQnaOpen) {
  const client = getSocket();
  if (!client?.connected) return false;
  client.emit("toggle_qna", { lectureId, isQnaOpen });
  return true;
}

export const subscribeToQnaState = (callback) =>
  subscribe("qna_state_change", callback);

export const subscribeToQnaQueue = (callback) =>
  subscribe("qna_queue_update", callback);

export const subscribeToVisualFrame = (callback) =>
  subscribe("visual_frame_update", callback);

// Integration placeholders: backend event names and payloads are not confirmed.
export function emitCognitiveUpdate() {
  return false;
}

export function subscribeToConfusion() {
  return () => {};
}

export function isSocketConfigured() {
  return Boolean(wsUrl);
}
