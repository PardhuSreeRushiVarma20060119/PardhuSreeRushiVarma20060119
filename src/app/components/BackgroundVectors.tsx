export function BackgroundVectors() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
      opacity: 0.03
    }}>
      {/* Geometric grid pattern */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Abstract geometric shapes */}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Top right circle */}
        <circle
          cx="85%"
          cy="15%"
          r="300"
          fill="none"
          stroke="rgba(45, 91, 255, 0.15)"
          strokeWidth="1"
        />
        
        {/* Top right smaller circle */}
        <circle
          cx="85%"
          cy="15%"
          r="200"
          fill="none"
          stroke="rgba(45, 91, 255, 0.1)"
          strokeWidth="0.5"
        />

        {/* Bottom left hexagon */}
        <polygon
          points="15,80 25,75 35,80 35,90 25,95 15,90"
          fill="none"
          stroke="rgba(45, 91, 255, 0.1)"
          strokeWidth="0.5"
          transform="translate(50, 600) scale(4)"
        />

        {/* Middle subtle lines */}
        <line
          x1="0"
          y1="50%"
          x2="30%"
          y2="50%"
          stroke="rgba(45, 91, 255, 0.05)"
          strokeWidth="1"
          strokeDasharray="10,10"
        />

        {/* Diagonal accent line */}
        <line
          x1="70%"
          y1="0"
          x2="100%"
          y2="30%"
          stroke="rgba(45, 91, 255, 0.08)"
          strokeWidth="0.5"
        />

        {/* Small squares pattern bottom */}
        <rect
          x="10%"
          y="85%"
          width="80"
          height="80"
          fill="none"
          stroke="rgba(45, 91, 255, 0.08)"
          strokeWidth="0.5"
        />
        <rect
          x="calc(10% + 40px)"
          y="calc(85% + 40px)"
          width="40"
          height="40"
          fill="none"
          stroke="rgba(45, 91, 255, 0.06)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
