import { useCallback, useRef } from "react";
import { useChat } from "./useChat";

/**
 * Emits `typing` while the user types, and auto-emits `stop_typing`
 * after a short pause (debounced) or when the message is sent.
 */
export const useTypingIndicator = (delay = 1500) => {
  const { emitTyping, emitStopTyping } = useChat();
  const timeoutRef = useRef(null);

  const handleTyping = useCallback(() => {
    emitTyping();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, delay);
  }, [emitTyping, emitStopTyping, delay]);

  const handleStop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    emitStopTyping();
  }, [emitStopTyping]);

  return { handleTyping, handleStop };
};
