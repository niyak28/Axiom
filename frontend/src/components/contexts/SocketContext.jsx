import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  connectSocket,
  disconnectSocket,
  isSocketConfigured,
  subscribeToConnection,
  subscribeToQnaQueue,
  subscribeToQnaState,
  subscribeToVisualFrame,
} from "../../api/socket";
import { useLectureContent } from "./LectureContent";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const {
    updateQnaState,
    updateQuestionQueue,
    updateVisualStream,
  } = useLectureContent();

  useEffect(() => {
    if (!isSocketConfigured()) return undefined;

    const removeConnection = subscribeToConnection(
      () => {
        setIsConnected(true);
        setSocketError(null);
      },
      (error) => {
        setIsConnected(false);
        setSocketError(error?.message || "Realtime connection failed.");
      },
    );
    const removeQnaState = subscribeToQnaState(({ isQnaOpen } = {}) => {
      if (typeof isQnaOpen === "boolean") updateQnaState(isQnaOpen);
    });
    const removeQueue = subscribeToQnaQueue(({ questions } = {}) => {
      updateQuestionQueue(questions);
    });
    const removeVisual = subscribeToVisualFrame((frame) => {
      updateVisualStream(frame);
    });

    connectSocket();
    return () => {
      removeConnection();
      removeQnaState();
      removeQueue();
      removeVisual();
      disconnectSocket();
    };
  }, [updateQnaState, updateQuestionQueue, updateVisualStream]);

  const value = useMemo(
    () => ({
      isConnected,
      socketError,
      isConfigured: isSocketConfigured(),
    }),
    [isConnected, socketError],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocketContext must be used within SocketProvider.");
  return context;
}
