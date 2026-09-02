export default function VintageOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden mix-blend-multiply">
      {/* Vinheta (Bordas escuras) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(58,34,24,0.4)_100%)]" />
      
      {/* Granulação de filme antigo (Noise) via SVG data URI inline */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

    </div>
  );
}
