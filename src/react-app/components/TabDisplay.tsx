import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { Song, ChordDiagram as ChordType } from '@/shared/types';
import ChordDiagram from './ChordDiagram';

interface TabDisplayProps {
  song: Song;
  chords: ChordType[];
}

export default function TabDisplay({ song, chords }: TabDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [currentLine, setCurrentLine] = useState(0);
  const [hoveredChord, setHoveredChord] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [touchedChord, setTouchedChord] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const tabLines = song.tab_content.split('\n').filter(line => line.trim());
  
  // Find chord diagram for hovered chord (with fallback matching)
  const getChordDiagram = (chordName: string) => {
    // First try exact match
    let chord = chords.find(c => c.chord_name.toLowerCase() === chordName.toLowerCase());
    
    // If not found, try alternative names and variations
    if (!chord) {
      const cleanChord = chordName.replace(/maj7?/i, '').replace(/min/i, 'm');
      chord = chords.find(c => c.chord_name.toLowerCase() === cleanChord.toLowerCase());
    }
    
    // Try with alternative fingering suffix
    if (!chord && !chordName.includes('_alt')) {
      chord = chords.find(c => c.chord_name.toLowerCase() === (chordName + '_alt').toLowerCase());
    }
    
    // Try common substitutions
    if (!chord) {
      const substitutions = {
        'bb': 'a#',
        'db': 'c#',
        'eb': 'd#',
        'gb': 'f#',
        'ab': 'g#'
      };
      
      const lowerChord = chordName.toLowerCase();
      for (const [from, to] of Object.entries(substitutions)) {
        if (lowerChord.includes(from)) {
          const substituted = lowerChord.replace(from, to);
          chord = chords.find(c => c.chord_name.toLowerCase() === substituted);
          if (chord) break;
        }
      }
    }
    
    return chord;
  };

  // Extract chords from tab content
  const extractChordsFromLine = (line: string): string[] => {
    const chordRegex = /\b[A-G][#b]?(?:maj7?|min7?|m7?|dim7?|aug|sus[24]?|add9?|_alt)?[0-9]?\b/g;
    return line.match(chordRegex) || [];
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentLine(prev => {
          const nextLine = prev + 1;
          if (nextLine >= tabLines.length) {
            setIsPlaying(false);
            return prev;
          }
          
          // Scroll the container
          if (containerRef.current) {
            const lineHeight = 24; // Approximate line height
            containerRef.current.scrollTop = nextLine * lineHeight;
          }
          
          return nextLine;
        });
      }, scrollSpeed * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, scrollSpeed, tabLines.length]);

  const handlePlay = () => setIsPlaying(!isPlaying);
  
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentLine(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 p-3 md:p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <h2 className="text-lg md:text-xl font-bold text-white truncate">{song.title}</h2>
            <p className="text-slate-400 text-sm truncate">{song.artist}</p>
            {song.key_signature && (
              <p className="text-xs md:text-sm text-slate-500">Key: {song.key_signature}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button
              onClick={handleReset}
              className="p-2 md:p-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded-lg transition-colors touch-manipulation"
              title="Reset to beginning"
            >
              <RotateCcw size={18} className="md:hidden" />
              <RotateCcw size={20} className="hidden md:block" />
            </button>
            
            <button
              onClick={handlePlay}
              className="p-2 md:p-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-700 text-white rounded-lg transition-colors touch-manipulation"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <>
                  <Pause size={18} className="md:hidden" />
                  <Pause size={20} className="hidden md:block" />
                </>
              ) : (
                <>
                  <Play size={18} className="md:hidden" />
                  <Play size={20} className="hidden md:block" />
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 md:p-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-600 text-white rounded-lg transition-colors touch-manipulation"
              title="Settings"
            >
              <Settings size={18} className="md:hidden" />
              <Settings size={20} className="hidden md:block" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 md:mt-4 p-3 bg-slate-700 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="text-xs md:text-sm text-slate-300 flex-shrink-0">
                Scroll Speed:
              </label>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs text-slate-400">Fast</span>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500 h-2 touch-manipulation"
                />
                <span className="text-xs text-slate-400">Slow</span>
                <span className="text-xs md:text-sm text-slate-300 w-8 text-center">{scrollSpeed}s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-2 md:p-4 font-mono text-xs md:text-sm leading-5 md:leading-6 relative"
        style={{ 
          height: 'calc(100vh - 200px)',
          maxHeight: showSettings ? 'calc(100vh - 260px)' : 'calc(100vh - 200px)'
        }}
      >
        {tabLines.map((line, index) => {
          const isCurrentLine = index === currentLine;
          const lineChordsNames = extractChordsFromLine(line);
          
          return (
            <div
              key={index}
              className={`py-1 px-2 rounded transition-colors ${
                isCurrentLine && isPlaying 
                  ? 'bg-blue-900/50 border-l-4 border-blue-500' 
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <span className="text-slate-300 whitespace-pre-wrap">
                {line.split(/(\b[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?[0-9]?\b)/).map((part, partIndex) => {
                  if (lineChordsNames.includes(part)) {
                    return (
                      <span
                        key={partIndex}
                        className="text-blue-400 font-bold cursor-pointer hover:text-blue-300 active:text-blue-200 relative select-none touch-manipulation"
                        onMouseEnter={() => setHoveredChord(part)}
                        onMouseLeave={() => setHoveredChord(null)}
                        onTouchStart={() => {
                          setTouchedChord(part);
                          setHoveredChord(part);
                        }}
                        onTouchEnd={() => {
                          setTimeout(() => {
                            setTouchedChord(null);
                            setHoveredChord(null);
                          }, 2000); // Show for 2 seconds on mobile
                        }}
                        onClick={() => {
                          if (touchedChord === part) {
                            setTouchedChord(null);
                            setHoveredChord(null);
                          } else {
                            setTouchedChord(part);
                            setHoveredChord(part);
                          }
                        }}
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chord Diagram Tooltip */}
      {hoveredChord && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-sm p-3 md:p-4 rounded-lg border border-slate-600 shadow-2xl max-w-xs mx-2">
            {getChordDiagram(hoveredChord) ? (
              <div className="text-center">
                <ChordDiagram 
                  chord={getChordDiagram(hoveredChord)!} 
                  size={window.innerWidth < 768 ? "md" : "lg"} 
                />
                <div className="mt-2 text-slate-300 text-xs md:text-sm">
                  {getChordDiagram(hoveredChord)!.chord_name} Fingering
                </div>
                {touchedChord && (
                  <div className="mt-1 text-slate-500 text-xs">
                    Tap again to dismiss
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-2 md:p-4">
                <div className="text-white font-bold mb-2 text-sm md:text-base">{hoveredChord}</div>
                <div className="text-slate-400 text-xs md:text-sm">Chord diagram not available</div>
                <div className="text-slate-500 text-xs mt-1">Try a different chord variation</div>
                {touchedChord && (
                  <div className="mt-1 text-slate-500 text-xs">
                    Tap again to dismiss
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
