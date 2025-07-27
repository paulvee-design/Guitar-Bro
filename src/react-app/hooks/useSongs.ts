import { useState, useEffect } from 'react';
import { Song, CreateSong, ChordDiagram } from '@/shared/types';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [chords, setChords] = useState<ChordDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all songs
  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (!response.ok) throw new Error('Failed to fetch songs');
      const data = await response.json();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch songs');
    }
  };

  // Fetch all chord diagrams
  const fetchChords = async () => {
    try {
      const response = await fetch('/api/chords');
      if (!response.ok) throw new Error('Failed to fetch chords');
      const data = await response.json();
      setChords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chords');
    }
  };

  // Add a new song
  const addSong = async (songData: CreateSong) => {
    try {
      setError(null);
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add song');
      }

      const newSong = await response.json();
      setSongs(prev => [newSong, ...prev]); // Add to beginning of list
      return newSong;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add song';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete a song
  const deleteSong = async (songId: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete song');
      }

      setSongs(prev => prev.filter(song => song.id !== songId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete song';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSongs(), fetchChords()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    songs,
    chords,
    loading,
    error,
    addSong,
    deleteSong,
    refetch: () => Promise.all([fetchSongs(), fetchChords()]),
  };
}
