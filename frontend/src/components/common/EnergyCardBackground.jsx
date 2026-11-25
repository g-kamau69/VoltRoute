import "./EnergyCardBackground.css";

export default function EnergyCardBackground({
  variant = "battery",
}) {
  return (
    <div
      className={`vfx-background vfx-${variant}`}
      aria-hidden="true"
    >

      <div className="vfx-glow" />

      {/* Battery circuit animation */}

      {variant === "battery" && (
        <svg
          className="vfx-artwork"
          viewBox="0 0 400 220"
          preserveAspectRatio="xMidYMid slice"
        >

          <g className="vfx-circuit-lines">

            <path d="M180 220V150H235V90H300V30H400" />

            <path d="M220 220V170H280V120H340V65H400" />

            <path d="M260 220V190H330V155H400" />

            <path d="M310 220V180H370V100H400" />

            <path d="M350 220V205H400" />

          </g>

          <g className="vfx-circuit-points">

            <circle cx="235" cy="90" r="4" />

            <circle cx="300" cy="30" r="4" />

            <circle cx="280" cy="120" r="4" />

            <circle cx="330" cy="155" r="4" />

          </g>

          <path
            className="vfx-electric-symbol"
            d="M330 35L272 117H318L292 190L371 88H321Z"
          />

        </svg>
      )}


      {/* Remaining energy animation */}

      {variant === "energy" && (
        <svg
          className="vfx-artwork"
          viewBox="0 0 400 220"
          preserveAspectRatio="xMidYMid slice"
        >

          <g className="vfx-energy-waves">

            <path
              className="vfx-wave vfx-wave-one"
              d="M-50 140Q20 20 100 135T250 105T450 100"
            />

            <path
              className="vfx-wave vfx-wave-two"
              d="M-50 160Q20 40 100 155T250 125T450 120"
            />

            <path
              className="vfx-wave vfx-wave-three"
              d="M-50 180Q20 60 100 175T250 145T450 140"
            />

            <path
              className="vfx-wave vfx-wave-four"
              d="M-50 200Q20 80 100 195T250 165T450 160"
            />

          </g>

        </svg>
      )}


      {/* Estimated range animation */}

      {variant === "range" && (
        <svg
          className="vfx-artwork"
          viewBox="0 0 400 220"
          preserveAspectRatio="xMidYMid slice"
        >

          <g className="vfx-map-grid">

            {Array.from({ length: 10 }, (_, index) => (
              <path
                key={`vertical-${index}`}
                d={`M${index * 55 - 130} 220L${index * 55 + 50} 0`}
              />
            ))}

            {Array.from({ length: 8 }, (_, index) => (
              <path
                key={`horizontal-${index}`}
                d={`M0 ${index * 35 - 100}L400 ${index * 35 + 60}`}
              />
            ))}

          </g>

          <path
            className="vfx-route-shadow"
            d="M40 220L120 155L205 175L260 80L350 30"
          />

          <path
            className="vfx-route-path"
            d="M40 220L120 155L205 175L260 80L350 30"
          />

          <circle
            className="vfx-route-destination-ring"
            cx="350"
            cy="30"
            r="14"
          />

          <circle
            className="vfx-route-destination"
            cx="350"
            cy="30"
            r="5"
          />

        </svg>
      )}

      <div className="vfx-overlay" />

    </div>
  );
}
