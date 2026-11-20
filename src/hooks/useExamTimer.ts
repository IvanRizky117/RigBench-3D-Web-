import { useCallback, useEffect, useRef, useState } from 'react';

interface UseExamTimerOptions {
  initialSeconds: number;
  running: boolean;
  onExpire: () => void;
}

export function useExamTimer({ initialSeconds, running, onExpire }: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const reset = useCallback((seconds: number) => {
    setRemainingSeconds(seconds);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running]);

  return {
    remainingSeconds,
    elapsedSeconds,
    reset,
  };
}
