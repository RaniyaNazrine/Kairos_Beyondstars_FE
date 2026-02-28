import { useState, useCallback, useRef } from "react";
import { chat } from "../lib/kairosClient";

// Human-readable labels for each thinking step
const STEP_LABELS = {
  decomposing_query: "Understanding your request…",
  searching: "Searching restaurants…",
  evaluating: "Ranking results…",
  checking_allergies: "Checking allergy safety…",
};

/**
 * React hook for streaming chat with the Kairos Agent.
 *
 * @param {string} uid - Authenticated user's UUID
 * @returns {{ sendMessage, result, thinkingStep, thinkingLabel, isStreaming, error }}
 */
export function useChat(uid) {
  const [result, setResult] = useState(null);
  const [thinkingStep, setThinkingStep] = useState(null);
  const [thinkingLabel, setThinkingLabel] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef([]);

  const sendMessage = useCallback(
    async (text) => {
      setIsStreaming(true);
      setThinkingStep(null);
      setThinkingLabel(null);
      setResult(null);
      setError(null);

      try {
        for await (const event of chat.stream(text, historyRef.current)) {
          if (event.event === "thinking") {
            const step = event.data.step;
            setThinkingStep(step);
            setThinkingLabel(STEP_LABELS[step] ?? step);
          } else if (event.event === "result") {
            const payload = event.data;
            setResult(payload);
            // Append to history — use raw .message string, NOT rendered text
            historyRef.current = [
              ...historyRef.current,
              { role: "user", content: text },
              { role: "assistant", content: payload.message },
            ].slice(-20); // Keep last 10 turns (20 messages)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsStreaming(false);
        setThinkingStep(null);
        setThinkingLabel(null);
      }
    },
    [uid] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setResult(null);
  }, []);

  return {
    sendMessage,
    result,
    thinkingStep,
    thinkingLabel,
    isStreaming,
    error,
    clearHistory,
  };
}
