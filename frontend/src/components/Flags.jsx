/**
 * Small flag icons for the country code selector.
 * Syrian flag = Syrian Revolution flag (green/white/black + 3 red stars) - same as main flag.
 */

export const SyrianFlagIcon = ({ className = "" }) => (
  <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="0" y="0" width="30" height="6.67" fill="#0f7b3a" />
    <rect x="0" y="6.67" width="30" height="6.67" fill="#ffffff" />
    <rect x="0" y="13.33" width="30" height="6.67" fill="#0a0a0a" />
    <Star cx={9} cy={10} size={1.8} />
    <Star cx={15} cy={10} size={1.8} />
    <Star cx={21} cy={10} size={1.8} />
  </svg>
);

export const TurkishFlagIcon = ({ className = "" }) => (
  <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect width="30" height="20" fill="#e30a17" />
    {/* Crescent */}
    <circle cx="12" cy="10" r="4.5" fill="#ffffff" />
    <circle cx="13.3" cy="10" r="3.6" fill="#e30a17" />
    {/* Star */}
    <Star cx={17.8} cy={10} size={1.7} fill="#ffffff" />
  </svg>
);

export const USFlagIcon = ({ className = "" }) => (
  <svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    {/* 13 alternating stripes */}
    {Array.from({ length: 13 }).map((_, i) => (
      <rect
        key={i}
        x="0"
        y={i * (20 / 13)}
        width="30"
        height={20 / 13}
        fill={i % 2 === 0 ? "#b22234" : "#ffffff"}
      />
    ))}
    {/* Blue canton */}
    <rect x="0" y="0" width="12" height={20 * (7 / 13)} fill="#3c3b6e" />
    {/* Simplified stars (3 rows × 4 cols) */}
    {[0, 1, 2].map((row) =>
      [0, 1, 2, 3].map((col) => (
        <circle
          key={`${row}-${col}`}
          cx={2 + col * 2.6}
          cy={1.8 + row * 3.2}
          r="0.45"
          fill="#ffffff"
        />
      ))
    )}
  </svg>
);

const Star = ({ cx, cy, size, fill = "#ce1126" }) => {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? size : size / 2.5;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return <polygon points={points.join(" ")} fill={fill} />;
};

export const COUNTRIES = [
  { code: "SY", dial: "+963", name: { ar: "سوريا", tr: "Suriye", en: "Syria" }, Flag: SyrianFlagIcon },
  { code: "TR", dial: "+90",  name: { ar: "تركيا", tr: "Türkiye", en: "Turkey" }, Flag: TurkishFlagIcon },
  { code: "US", dial: "+1",   name: { ar: "الولايات المتحدة", tr: "ABD", en: "United States" }, Flag: USFlagIcon },
];
