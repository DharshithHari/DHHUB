import React, { useEffect } from 'react';

// minimal CSS-confetti that creates DOM tokens and animates them using inline styles
export default function Confetti({ count = 40 }: { count?: number }) {
  useEffect(() => {
    // nothing to do; DOM is rendered by React
  }, []);

  const colors = ['#ef4444','#f97316','#facc15','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];

  return (
    <div className="confetti-root pointer-events-none fixed inset-0 z-50">
      {Array.from({ length: count }).map((_, i) => {
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}%`,
          background: colors[i % colors.length],
          transform: `rotate(${Math.random() * 360}deg)`,
          animationDelay: `${Math.random() * 0.5}s`,
          animationDuration: `${1.5 + Math.random() * 2}s`
        };
        return <span key={i} className="confetti-piece" style={style} />;
      })}

      <style>{`
        .confetti-root { overflow: hidden; }
        .confetti-piece {
          position: absolute;
          top: -10%;
          width: 10px;
          height: 18px;
          border-radius: 2px;
          opacity: 0.95;
          transform-origin: center;
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(.2,.8,.2,1);
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
