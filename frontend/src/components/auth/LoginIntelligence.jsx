import {
  Zap,
  Route,
  BatteryCharging,
  Radio,
  MapPin,
} from "lucide-react";

import "./LoginIntelligence.css";

export default function LoginIntelligence() {
  return (
    <aside className="vli-hero">

      <div className="vli-map-background">

        <svg
          className="vli-map"
          viewBox="0 0 900 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>

            <pattern
              id="vli-grid"
              width="45"
              height="45"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M45 0H0V45"
                fill="none"
                stroke="#5eead4"
                strokeOpacity=".055"
              />
            </pattern>

            <radialGradient id="vli-map-glow">
              <stop
                offset="0%"
                stopColor="#2dd4bf"
                stopOpacity=".18"
              />
              <stop
                offset="100%"
                stopColor="#2dd4bf"
                stopOpacity="0"
              />
            </radialGradient>

            <filter id="vli-route-glow">
              <feGaussianBlur stdDeviation="7" />
            </filter>

          </defs>

          <rect
            width="900"
            height="900"
            fill="url(#vli-grid)"
          />

          <circle
            cx="470"
            cy="350"
            r="380"
            fill="url(#vli-map-glow)"
          />

          {/* Decorative city blocks */}

          <g className="vli-map-blocks">

            {Array.from({ length: 7 }, (_, row) =>
              Array.from({ length: 7 }, (_, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 135 + 15}
                  y={row * 125 + 12}
                  width={90 + (col % 3) * 8}
                  height={85}
                  rx="5"
                  transform={`rotate(-12 ${
                    col * 135 + 60
                  } ${row * 125 + 55})`}
                />
              ))
            )}

          </g>

          {/* Secondary road network */}

          <g className="vli-minor-roads">

            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={`road-x-${i}`}
                d={`M${i * 85 - 250} 900L${
                  i * 85 + 180
                } 0`}
              />
            ))}

            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={`road-y-${i}`}
                d={`M0 ${i * 90 - 180}L900 ${
                  i * 90 + 70
                }`}
              />
            ))}

          </g>

          {/* Main roads */}

          <g className="vli-main-roads">

            <path d="M0 220L250 160L500 230L900 130" />

            <path d="M0 410L280 340L550 430L900 330" />

            <path d="M0 620L300 550L620 650L900 560" />

            <path d="M180 0L250 160L280 340L300 550L420 900" />

            <path d="M510 0L500 230L550 430L620 650L720 900" />

            <path d="M790 0L710 180L740 420L810 900" />

          </g>

          {/* Highlighted delivery route */}

          <path
            className="vli-route-glow"
            d="M120 380L280 340L250 160L500 230L550 430L740 390L710 180"
          />

          <path
            className="vli-route-base"
            d="M120 380L280 340L250 160L500 230L550 430L740 390L710 180"
          />

          <path
            className="vli-route-flow"
            d="M120 380L280 340L250 160L500 230L550 430L740 390L710 180"
          />

          {/* Alternative logistics route */}

          <path
            className="vli-alternative-route"
            d="M280 340L300 550L620 650L740 390"
          />

          {/* Route nodes */}

          {[
            [120, 380],
            [280, 340],
            [250, 160],
            [500, 230],
            [550, 430],
            [740, 390],
            [710, 180],
            [300, 550],
          ].map(([x, y], index) => (

            <g key={index}>

              <circle
                className="vli-node-ring"
                cx={x}
                cy={y}
                r="12"
              />

              <circle
                className="vli-route-node"
                cx={x}
                cy={y}
                r="5"
              />

            </g>

          ))}

          {/* Moving vehicle marker */}

          <g className="vli-moving-marker">

            <circle r="24" fill="#103e38" />

            <circle
              r="24"
              fill="none"
              stroke="#6ee7ad"
              strokeWidth="2"
            />

            <circle
              className="vli-vehicle-pulse"
              r="29"
              fill="none"
              stroke="#6ee7ad"
              strokeWidth="1.5"
            />

            <g
              stroke="#b8ffdc"
              fill="none"
              strokeWidth="2"
            >
              <circle cx="-9" cy="6" r="5" />
              <circle cx="9" cy="6" r="5" />

              <path d="M-9 6L0 -7L9 6M-4 -7H4M-5 0H6" />
            </g>

            <animateMotion
              dur="14s"
              repeatCount="1"
              fill="freeze"
              path="M120 380L280 340L250 160L500 230L550 430L740 390L710 180"
            />

          </g>

          {/* Static vehicle for reduced-motion mode */}

          <circle
            className="vli-static-marker"
            cx="550"
            cy="430"
            r="12"
            fill="#6ee7ad"
          />

        </svg>

      </div>

      {/* Hero label */}

      <div className="vli-hero-top">

        <div className="vli-hero-tag">
          <Zap size={15} />
          Electric Fleet Intelligence
        </div>

        <span className="vli-network-label">
          KENYA / MOBILITY
        </span>

      </div>

      {/* Floating logistics information */}

      <div className="vli-map-label vli-pickup">

        <div className="vli-label-icon">
          <MapPin size={18} />
        </div>

        <div>
          <small>LOGISTICS NODE</small>
          <strong>Pickup location</strong>
        </div>

      </div>

      <div className="vli-map-label vli-destination">

        <div className="vli-label-icon">
          <Route size={18} />
        </div>

        <div>
          <small>DELIVERY NODE</small>
          <strong>Route destination</strong>
        </div>

      </div>

      <div className="vli-map-label vli-battery-label">

        <div className="vli-telemetry-heading">
          <span className="vli-status-dot" />
          Sample telemetry
        </div>

        <strong>EV-001</strong>

        <div className="vli-battery-row">

          <div className="vli-battery">
            <div className="vli-battery-fill" />
          </div>

          <b>82%</b>

        </div>

        <small>Illustrative battery charge</small>

      </div>

      <div className="vli-map-vignette" />

      {/* Product headline */}

      <div className="vli-hero-content">

        <div className="vli-hero-eyebrow">
          Built for intelligent mobility
        </div>

        <h2>
          Every route.
          <br />
          Every charge.
          <br />
          <span>Connected.</span>
        </h2>

        <p>
          Intelligent routing, battery-aware journeys
          and connected fleet operations for the next
          generation of electric mobility in Kenya.
        </p>

        <div className="vli-feature-list">

          <span>
            <Route size={16} />
            Smart Routing
          </span>

          <span>
            <BatteryCharging size={16} />
            Energy Intelligence
          </span>

          <span>
            <Radio size={16} />
            Fleet Monitoring
          </span>

        </div>

        <div className="vli-hero-footer">
          <span>VOLTROUTE INTELLIGENCE</span>
          <span>Conceptual route visualization</span>
        </div>

      </div>

    </aside>
  );
}