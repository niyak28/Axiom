import { useCallback, useState } from "react";
import { uploadLectureRecording } from "../../api/client";

export default function useLectureRecording() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const uploadRecording = useCallback(async (file, lectureId) => {
    setIsUploading(true);
    setError(null);
    setIsComplete(false);
    try {
      const response = await uploadLectureRecording(file, lectureId);
      setResult(response);
      setIsComplete(true);
      return response;
    } catch (uploadError) {
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setIsComplete(false);
  }, []);

  return { uploadRecording, isUploading, error, result, isComplete, reset };
}
