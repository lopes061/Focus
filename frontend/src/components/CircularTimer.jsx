const modeColors = {
  focus: 'stroke-timer-focus',
  shortBreak: 'stroke-timer-short',
  longBreak: 'stroke-timer-long',
};

const modeGlows = {
  focus: 'drop-shadow(0 0 20px hsl(1 77% 55% / 0.5))',
  shortBreak: 'drop-shadow(0 0 20px hsl(199 89% 48% / 0.5))',
  longBreak: 'drop-shadow(0 0 20px hsl(122 45% 33% / 0.5))',
};

export default function CircularTimer({ timeFormatted, progress, mode, isRunning }) {
  const radius = 160;
  const stroke = 6;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
        style={{ filter: isRunning ? modeGlows[mode] : 'none' }}
      >
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${modeColors[mode]} transition-all duration-1000 ease-linear`}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-timer text-6xl md:text-7xl font-bold tracking-wider text-muted-87 ${isRunning ? 'animate-timer-tick' : ''}`}>
          {timeFormatted}
        </span>
      </div>
    </div>
  );
}
