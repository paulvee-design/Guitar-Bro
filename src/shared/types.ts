import z from "zod";

export const SongSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  key_signature: z.string().nullable(),
  bpm: z.number().nullable(),
  tab_content: z.string(),
  audio_url: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateSongSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  key_signature: z.string().optional(),
  bpm: z.number().min(60).max(200).optional(),
  tab_content: z.string().min(1, "Tab content is required"),
  audio_url: z.string().url().optional(),
  duration_seconds: z.number().min(1).optional(),
});

export const ChordDiagramSchema = z.object({
  id: z.number(),
  chord_name: z.string(),
  fret_positions: z.string(),
  finger_positions: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateSongSchema = CreateSongSchema.partial();

export type Song = z.infer<typeof SongSchema>;
export type CreateSong = z.infer<typeof CreateSongSchema>;
export type UpdateSong = z.infer<typeof UpdateSongSchema>;
export type ChordDiagram = z.infer<typeof ChordDiagramSchema>;
