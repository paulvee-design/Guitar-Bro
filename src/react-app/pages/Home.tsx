import { useState } from 'react';
import { Plus, Music, Loader2, Menu, X } from 'lucide-react';
import { Song } from '@/shared/types';
import { useSongs } from '@/react-app/hooks/useSongs';
import SongList from '@/react-app/components/SongList';
import TabDisplay from '@/react-app/components/TabDisplay';
import AddSongModal from '@/react-app/components/AddSongModal';

export default function Home() {
  const { songs, chords, loading, error, addSong, deleteSong } = useSongs();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin mb-4">
          <Loader2 className="w-10 h-10 text-blue-500" />
        </div>
        <p className="text-slate-400">Loading Guitar Bro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleAddSong = async (songData: any) => {
    try {
      await addSong(songData);
    } catch (err) {
      // Error handling is done in the hook
      console.error('Failed to add song:', err);
    }
  };

  const handleDeleteSong = async (songId: number) => {
    if (selectedSong?.id === songId) {
      setSelectedSong(null);
    }
    
    try {
      await deleteSong(songId);
    } catch (err) {
      // Error handling is done in the hook
      console.error('Failed to delete song:', err);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
            >
              {showSidebar ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-700">
              <img 
                src="https://mocha-cdn.com/01984732-4e9f-7c80-a95f-fb7164ba3cf7/Copy-of-Rock-ON.jpg" 
                alt="Guitar Bro"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Guitar Bro</h1>
              <p className="text-slate-400 text-sm hidden sm:block">Interactive guitar tabs with autoscroll</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base"
          >
            <Plus size={18} className="md:hidden" />
            <Plus size={20} className="hidden md:block" />
            <span className="hidden sm:inline">Add Song</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          fixed md:relative z-50 md:z-auto
          w-80 h-full md:h-auto
        `}>
          <SongList
            songs={songs}
            selectedSong={selectedSong}
            onSelectSong={(song) => {
              setSelectedSong(song);
              setShowSidebar(false); // Close sidebar on mobile when song is selected
            }}
            onDeleteSong={handleDeleteSong}
          />
        </div>
        
        <div className="flex-1 p-2 md:p-4 overflow-hidden">
          {selectedSong ? (
            <TabDisplay song={selectedSong} chords={chords} />
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700">
              <div className="text-center">
                <Music className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-300 mb-2">No Song Selected</h2>
                <p className="text-slate-500 mb-6">
                  Choose a song from the sidebar to start playing tabs
                </p>
                {songs.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mx-auto"
                  >
                    <Plus size={20} />
                    Add Your First Song
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal */}
      <AddSongModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSong}
      />
    </div>
  );
}
