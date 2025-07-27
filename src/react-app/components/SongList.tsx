import { Music, Clock, Key, Trash2 } from 'lucide-react';
import { Song } from '@/shared/types';

interface SongListProps {
  songs: Song[];
  selectedSong: Song | null;
  onSelectSong: (song: Song) => void;
  onDeleteSong: (songId: number) => void;
}

export default function SongList({ songs, selectedSong, onSelectSong, onDeleteSong }: SongListProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Music size={20} />
          Your Songs
        </h2>
        <p className="text-slate-400 text-sm mt-1">{songs.length} songs</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {songs.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <Music size={48} className="mx-auto mb-2 opacity-50" />
            <p>No songs yet</p>
            <p className="text-sm mt-1">Add your first song to get started</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {songs.map((song) => (
              <div
                key={song.id}
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSong?.id === song.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                }`}
                onClick={() => onSelectSong(song)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{song.title}</h3>
                    <p className={`text-sm truncate ${
                      selectedSong?.id === song.id ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {song.artist}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {song.key_signature && (
                        <div className="flex items-center gap-1">
                          <Key size={12} />
                          <span>{song.key_signature}</span>
                        </div>
                      )}
                      
                      {song.duration_seconds && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatDuration(song.duration_seconds)}</span>
                        </div>
                      )}
                      
                      {song.bpm && (
                        <div className="text-xs">
                          {song.bpm} BPM
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSong(song.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                      selectedSong?.id === song.id
                        ? 'hover:bg-blue-700 text-blue-100'
                        : 'hover:bg-slate-500 text-slate-400 hover:text-red-400'
                    }`}
                    title="Delete song"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
