import { useCallback, useState } from "react";
import { sendFrictionScore } from "../../api/client";

export default function useFrictionTelemetry() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitFriction = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      return await sendFrictionScore(payload);
    } catch (submissionError) {
      setError(submissionError);
      throw submissionError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitFriction,
    isSubmitting,
    error,
  };
}
