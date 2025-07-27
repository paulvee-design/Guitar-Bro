import React, { useState } from 'react';
import { X, Plus, Search, Loader2, Music } from 'lucide-react';
import { CreateSong } from '@/shared/types';

interface SearchResult {
  title: string;
  artist: string;
  key_signature?: string;
  bpm?: number;
  duration_seconds?: number;
  tab_content: string;
}

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (song: CreateSong) => void;
}

export default function AddSongModal({ isOpen, onClose, onSubmit }: AddSongModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const [formData, setFormData] = useState<CreateSong>({
    title: '',
    artist: '',
    tab_content: '',
    key_signature: '',
    bpm: undefined,
    audio_url: '',
    duration_seconds: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/search-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const results = await response.json();
      setSearchResults(results);
      
      if (results.length === 0) {
        setErrors({ search: 'No songs found. Try a different search term or add manually.' });
      }
    } catch (err) {
      setErrors({ search: err instanceof Error ? err.message : 'Search failed' });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    setFormData({
      title: result.title,
      artist: result.artist,
      tab_content: result.tab_content,
      key_signature: result.key_signature || '',
      bpm: result.bpm || undefined,
      audio_url: '',
      duration_seconds: result.duration_seconds || undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.artist.trim()) newErrors.artist = 'Artist is required';
    if (!formData.tab_content.trim()) newErrors.tab_content = 'Tab content is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Clean up empty optional fields
      const cleanedData = {
        ...formData,
        key_signature: formData.key_signature?.trim() || undefined,
        audio_url: formData.audio_url?.trim() || undefined,
        bpm: formData.bpm || undefined,
        duration_seconds: formData.duration_seconds || undefined,
      };
      
      onSubmit(cleanedData);
      
      // Reset form
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      tab_content: '',
      key_signature: '',
      bpm: undefined,
      audio_url: '',
      duration_seconds: undefined,
    });
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setErrors({});
    setActiveTab('search');
  };

  const handleChange = (field: keyof CreateSong, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus size={20} />
            Add New Song
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            <Search size={18} className="inline mr-2" />
            Search Songs
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            <Music size={18} className="inline mr-2" />
            Manual Entry
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'search' ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Search for a song
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 p-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter song title and artist (e.g., 'Wonderwall Oasis' or 'Hotel California Eagles')"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    {searching ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        Search
                      </>
                    )}
                  </button>
                </div>
                {errors.search && <p className="text-red-400 text-sm mt-2">{errors.search}</p>}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Search Results</h3>
                  <div className="grid gap-3">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedResult === result
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-slate-600 bg-slate-700 hover:border-slate-500 hover:bg-slate-600'
                        }`}
                        onClick={() => handleSelectResult(result)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{result.title}</h4>
                            <p className="text-slate-300">{result.artist}</p>
                          </div>
                          <div className="text-right text-sm text-slate-400">
                            {result.key_signature && <div>Key: {result.key_signature}</div>}
                            {result.bpm && <div>{result.bpm} BPM</div>}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-800 p-2 rounded overflow-hidden">
                          {result.tab_content.split('\n').slice(0, 3).join('\n')}
                          {result.tab_content.split('\n').length > 3 && '\n...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Song Form */}
              {selectedResult && (
                <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white">Review & Add Song</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                      {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Artist *
                      </label>
                      <input
                        type="text"
                        value={formData.artist}
                        onChange={(e) => handleChange('artist', e.target.value)}
                        className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.artist ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                      {errors.artist && <p className="text-red-400 text-sm mt-1">{errors.artist}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Key Signature
                      </label>
                      <input
                        type="text"
                        value={formData.key_signature || ''}
                        onChange={(e) => handleChange('key_signature', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        BPM
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="200"
                        value={formData.bpm || ''}
                        onChange={(e) => handleChange('bpm', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Audio URL
                      </label>
                      <input
                        type="url"
                        value={formData.audio_url || ''}
                        onChange={(e) => handleChange('audio_url', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/song.mp3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration_seconds || ''}
                        onChange={(e) => handleChange('duration_seconds', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Tab Content *
                    </label>
                    <textarea
                      value={formData.tab_content}
                      onChange={(e) => handleChange('tab_content', e.target.value)}
                      rows={12}
                      className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                        errors.tab_content ? 'border-red-500' : 'border-slate-600'
                      }`}
                    />
                    {errors.tab_content && <p className="text-red-400 text-sm mt-1">{errors.tab_content}</p>}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Add Song
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // Manual Entry Tab
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Enter song title"
                  />
                  {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Artist *
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => handleChange('artist', e.target.value)}
                    className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.artist ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Enter artist name"
                  />
                  {errors.artist && <p className="text-red-400 text-sm mt-1">{errors.artist}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Key Signature
                  </label>
                  <input
                    type="text"
                    value={formData.key_signature || ''}
                    onChange={(e) => handleChange('key_signature', e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., C, Dm, F#"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    BPM
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={formData.bpm || ''}
                    onChange={(e) => handleChange('bpm', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Audio URL
                  </label>
                  <input
                    type="url"
                    value={formData.audio_url || ''}
                    onChange={(e) => handleChange('audio_url', e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/song.mp3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_seconds || ''}
                    onChange={(e) => handleChange('duration_seconds', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="240"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tab Content *
                </label>
                <textarea
                  value={formData.tab_content}
                  onChange={(e) => handleChange('tab_content', e.target.value)}
                  rows={12}
                  className={`w-full p-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.tab_content ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="Paste your guitar tabs here...

Example:
C              F              G              C
I was walking down the street one day
C              F              G              C
When I saw you standing there

e|--0--0--0--0--|--1--1--1--1--|--3--3--3--3--|--0--0--0--0--|
B|--1--1--1--1--|--1--1--1--1--|--0--0--0--0--|--1--1--1--1--|
G|--0--0--0--0--|--2--2--2--2--|--0--0--0--0--|--0--0--0--0--|
D|--2--2--2--2--|--3--3--3--3--|--0--0--0--0--|--2--2--2--2--|
A|--3--3--3--3--|--3--3--3--3--|--2--2--2--2--|--3--3--3--3--|
E|--x--x--x--x--|--1--1--1--1--|--3--3--3--3--|--x--x--x--x--|"
                />
                {errors.tab_content && <p className="text-red-400 text-sm mt-1">{errors.tab_content}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Add Song
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
