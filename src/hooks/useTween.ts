import { useEffect, useRef, useState } from 'react';

// Плавно «догоняет» целевое значение за dur мс (ease-out cubic).
// Используется для перехода чистоты растения (как CSS transition в прототипе).
export function useTween(target: number, dur = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const valueRef = useRef(target);
  valueRef.current = value;

  useEffect(() => {
    fromRef.current = valueRef.current;
    startRef.current = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = () => {
      const k = Math.min(1, (Date.now() - startRef.current) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = fromRef.current + (target - fromRef.current) * eased;
      setValue(v);
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, dur]);

  return value;
}
