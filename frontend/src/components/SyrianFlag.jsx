export const SyrianFlag = ({ className = "" }) => {
  return (
    <div
      data-testid="syrian-flag"
      className={`relative overflow-hidden rounded-md shadow-[0_10px_30px_-12px_rgba(212,175,55,0.45)] ring-1 ring-[#d4af37]/30 ${className}`}
      style={{ aspectRatio: "3 / 2" }}
      aria-label="Syrian Revolution Flag"
    >
      <svg
        viewBox="0 0 300 200"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Green stripe */}
        <rect x="0" y="0" width="300" height="66.67" fill="#0f7b3a" />
        {/* White stripe */}
        <rect x="0" y="66.67" width="300" height="66.67" fill="#ffffff" />
        {/* Black stripe */}
        <rect x="0" y="133.33" width="300" height="66.67" fill="#0a0a0a" />
        {/* Three red stars on white middle band */}
        <Star cx={90} cy={100} size={18} />
        <Star cx={150} cy={100} size={18} />
        <Star cx={210} cy={100} size={18} />
      </svg>
    </div>
  );
};

const Star = ({ cx, cy, size }) => {
  // 5-pointed star polygon
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? size : size / 2.5;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return <polygon points={points.join(" ")} fill="#ce1126" />;
};

export default SyrianFlag;
