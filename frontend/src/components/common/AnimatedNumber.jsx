import { useEffect, useRef, useState } from "react";

import "./AnimatedNumber.css";

export default function AnimatedNumber({
  value,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value));

  const target = hasValue ? Number(value) : 0;

  const [displayValue, setDisplayValue] = useState(0);

  const currentValue = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!hasValue) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const from = currentValue.current;

    const startTime = performance.now();

    function animate(timestamp) {
      const progress =
        reducedMotion || duration <= 0
          ? 1
          : Math.min(
              (timestamp - startTime) / duration,
              1
            );

      /* Ease-out cubic animation */

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      const nextValue =
        from + (target - from) * easedProgress;

      currentValue.current = nextValue;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameRef.current =
          requestAnimationFrame(animate);
      } else {
        currentValue.current = target;

        setDisplayValue(target);

        frameRef.current = null;
      }
    }

    frameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };

  }, [target, duration, hasValue]);

  function formatNumber(number) {
    return number.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return (
    <span
      className={`vran-number ${className}`}
      aria-label={
        hasValue
          ? `${prefix}${formatNumber(target)}${suffix}`
          : "Data unavailable"
      }
    >
      <span aria-hidden="true">
        {hasValue
          ? `${prefix}${formatNumber(displayValue)}${suffix}`
          : "—"}
      </span>
    </span>
  );
}
