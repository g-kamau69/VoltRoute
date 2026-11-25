import "./BatteryIndicator.css";

export default function BatteryIndicator({
  level,
  size = "md",
  showPercentage = true,
  showStatus = false,
  isCharging = false,
}) {
  const numericLevel = Number(level);

  const hasData =
    level !== null &&
    level !== undefined &&
    level !== "" &&
    Number.isFinite(numericLevel) &&
    numericLevel >= 0 &&
    numericLevel <= 100;

  const percentage = hasData
    ? Math.round(numericLevel)
    : 0;

  const charging = hasData && isCharging;

  let batteryState = "unknown";
  let statusLabel = "No data";

  if (hasData) {
    if (percentage <= 15) {
      batteryState = "critical";
      statusLabel = "Critical";
    } else if (percentage <= 30) {
      batteryState = "low";
      statusLabel = "Low";
    } else {
      batteryState = "normal";
      statusLabel = "Normal";
    }
  }

  if (charging) {
    statusLabel = "Charging";
  }

  const accessibleLabel = hasData
    ? `Battery charge: ${percentage}%. ${statusLabel}`
    : "Battery charge unavailable";

  return (
    <div
      className={[
        "vrb-indicator",
        `vrb-size-${size}`,
        `vrb-${batteryState}`,
        charging ? "vrb-charging" : "",
      ].join(" ")}
      role="img"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <div className="vrb-main" aria-hidden="true">

        {/* Smartphone-style battery */}

        <div className="vrb-battery">

          <div className="vrb-battery-body">

            <div className="vrb-battery-track">

              <div
                className="vrb-battery-fill"
                style={{
                  width: `${percentage}%`,
                }}
              />

            </div>

            {charging && (
              <span className="vrb-charging-symbol">
                ⚡
              </span>
            )}

          </div>

          <div className="vrb-battery-terminal" />

        </div>

        {/* Battery percentage */}

        {showPercentage && (
          <span className="vrb-percentage">
            {hasData ? `${percentage}%` : "—"}
          </span>
        )}

      </div>

      {/* Optional battery status */}

      {showStatus && (
        <span className="vrb-status" aria-hidden="true">
          {statusLabel}
        </span>
      )}

    </div>
  );
}
