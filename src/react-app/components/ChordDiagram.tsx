import { ChordDiagram as ChordType } from '@/shared/types';

interface ChordDiagramProps {
  chord: ChordType;
  size?: 'sm' | 'md' | 'lg';
}

export default function ChordDiagram({ chord, size = 'md' }: ChordDiagramProps) {
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-24 h-28',
    lg: 'w-32 h-36'
  };

  // Parse fret positions (e.g., "032010" or "xx0232")
  const frets = chord.fret_positions.split('').map(pos => pos === 'x' ? -1 : parseInt(pos));
  const strings = 6;
  const fretCount = 4;

  return (
    <div className={`${sizeClasses[size]} bg-slate-800 rounded-lg p-2 border border-slate-600`}>
      <div className="text-center text-white text-xs font-bold mb-1">
        {chord.chord_name}
      </div>
      
      <svg viewBox="0 0 60 80" className="w-full h-full">
        {/* Fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1="10"
            y1={15 + i * 15}
            x2="50"
            y2={15 + i * 15}
            stroke="#64748b"
            strokeWidth={i === 0 ? "2" : "1"}
          />
        ))}
        
        {/* String lines */}
        {Array.from({ length: strings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={10 + i * 8}
            y1="15"
            x2={10 + i * 8}
            y2="75"
            stroke="#64748b"
            strokeWidth="1"
          />
        ))}
        
        {/* Finger positions */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) {
            // X mark for muted strings
            return (
              <g key={`muted-${stringIndex}`}>
                <line
                  x1={10 + stringIndex * 8 - 3}
                  y1="8"
                  x2={10 + stringIndex * 8 + 3}
                  y2="2"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <line
                  x1={10 + stringIndex * 8 - 3}
                  y1="2"
                  x2={10 + stringIndex * 8 + 3}
                  y2="8"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
              </g>
            );
          } else if (fret === 0) {
            // Open string circle
            return (
              <circle
                key={`open-${stringIndex}`}
                cx={10 + stringIndex * 8}
                cy="5"
                r="3"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            );
          } else if (fret > 0) {
            // Finger position dot
            return (
              <circle
                key={`finger-${stringIndex}`}
                cx={10 + stringIndex * 8}
                cy={15 + (fret - 0.5) * 15}
                r="4"
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth="1"
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}
