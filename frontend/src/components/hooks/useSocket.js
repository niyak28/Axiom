import { useCallback } from "react";
import { toggleQna } from "../../api/socket";
import { useSocketContext } from "../contexts/SocketContext";

export default function useSocket() {
  const socketState = useSocketContext();

  const setQnaOpen = useCallback(
    (lectureId, isOpen) => toggleQna(lectureId, isOpen),
    [],
  );

  return { ...socketState, setQnaOpen };
}
