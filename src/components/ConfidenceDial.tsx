"use client";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  /** When set, shows the target needle (reveal). */
  target?: number | null;
  label?: string;
};

export function ConfidenceDial({
  value,
  onChange,
  disabled = false,
  target = null,
  label = "Confidence",
}: Props) {
  const interactive = Boolean(onChange) && !disabled;

  return (
    <div className="dial">
      <div className="dial-face">
        <div className="dial-ticks" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => {
            const deg = -90 + i * 18;
            return (
              <span
                key={i}
                className="dial-tick"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <span className="dial-tick-mark" />
                <span
                  className="dial-tick-label"
                  style={{ transform: `rotate(${-deg}deg)` }}
                >
                  {i * 10}
                </span>
              </span>
            );
          })}
        </div>

        {target !== null && (
          <div
            className="dial-needle dial-needle-target"
            style={{ transform: `rotate(${-90 + target * 1.8}deg)` }}
            aria-hidden="true"
          />
        )}

        <div
          className="dial-needle dial-needle-guess"
          style={{ transform: `rotate(${-90 + value * 1.8}deg)` }}
          aria-hidden="true"
        />

        <div className="dial-hub">
          <span className="dial-value">{Math.round(value)}</span>
          <span className="dial-unit">%</span>
        </div>
      </div>

      <label className="dial-control">
        <span className="sr-only">{label}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          disabled={!interactive}
          onChange={(e) => onChange?.(Number(e.target.value))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-label={label}
        />
      </label>

      <div className="dial-ends" aria-hidden="true">
        <span>Coin flip</span>
        <span>Certain</span>
      </div>
    </div>
  );
}
