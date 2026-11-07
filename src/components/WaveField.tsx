export function WaveField() {
  return (
    <div className="wave-field" aria-hidden="true">
      <div className="wave-glow wave-glow-a" />
      <div className="wave-glow wave-glow-b" />
      <svg className="wave-lines" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path
          className="wave-path wave-path-1"
          d="M-50 420 C150 280, 350 560, 550 420 S950 280, 1250 420"
          fill="none"
        />
        <path
          className="wave-path wave-path-2"
          d="M-50 460 C180 340, 380 580, 580 460 S980 340, 1250 460"
          fill="none"
        />
        <path
          className="wave-path wave-path-3"
          d="M-50 500 C200 400, 400 600, 600 500 S1000 400, 1250 500"
          fill="none"
        />
      </svg>
    </div>
  );
}
