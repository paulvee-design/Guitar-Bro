import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateSongSchema, UpdateSongSchema } from "@/shared/types";
import OpenAI from "openai";
import { z } from "zod";

const app = new Hono<{ Bindings: Env }>();

const SearchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

// Search for songs using AI
app.post("/api/search-songs", zValidator("json", SearchQuerySchema), async (c) => {
  const { query } = c.req.valid("json");
  
  if (!c.env.OPENAI_API_KEY) {
    return c.json({ error: "OpenAI API key not configured" }, 500);
  }

  try {
    const openai = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a music expert that helps find popular songs and creates realistic guitar tabs. When given a search query, provide information about well-known songs that match the query.

Generate 2-3 popular songs that match the search term. For each song, provide:
- title: The exact song title
- artist: The artist/band name
- key_signature: The song's key (e.g., "C", "Em", "F#")
- bpm: Approximate beats per minute
- duration_seconds: Approximate song duration in seconds
- tab_content: Generate realistic guitar tabs that include:
  * Chord progressions with chord names above lyrics
  * At least one verse and one chorus
  * Basic tablature notation using standard format (e|B|G|D|A|E)
  * Common chord fingerings
  * Make it educational and playable for guitarists

Focus on popular, well-known songs that guitarists commonly learn. Make the tabs beginner to intermediate friendly.`
        },
        {
          role: 'user',
          content: `Find songs for: "${query}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'song_search_results',
          schema: {
            type: 'object',
            properties: {
              songs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    artist: { type: 'string' },
                    key_signature: { type: 'string' },
                    bpm: { type: 'number' },
                    duration_seconds: { type: 'number' },
                    tab_content: { type: 'string' }
                  },
                  required: ['title', 'artist', 'tab_content'],
                  additionalProperties: false
                }
              }
            },
            required: ['songs'],
            additionalProperties: false
          },
          strict: true
        }
      }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"songs":[]}');
    return c.json(result.songs);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return c.json({ error: 'Failed to search for songs. Please try again.' }, 500);
  }
});

// Get all songs
app.get("/api/songs", async (c) => {
  const db = c.env.DB;
  const songs = await db.prepare("SELECT * FROM songs ORDER BY created_at DESC").all();
  return c.json(songs.results);
});

// Get a specific song
app.get("/api/songs/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const song = await db.prepare("SELECT * FROM songs WHERE id = ?").bind(id).first();
  
  if (!song) {
    return c.json({ error: "Song not found" }, 404);
  }
  
  return c.json(song);
});

// Create a new song
app.post("/api/songs", zValidator("json", CreateSongSchema), async (c) => {
  const db = c.env.DB;
  const songData = c.req.valid("json");
  
  const result = await db.prepare(`
    INSERT INTO songs (title, artist, key_signature, bpm, tab_content, audio_url, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    songData.title,
    songData.artist,
    songData.key_signature || null,
    songData.bpm || null,
    songData.tab_content,
    songData.audio_url || null,
    songData.duration_seconds || null
  ).run();
  
  const newSong = await db.prepare("SELECT * FROM songs WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(newSong, 201);
});

// Update a song
app.put("/api/songs/:id", zValidator("json", UpdateSongSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const songData = c.req.valid("json");
  
  // Check if song exists
  const existingSong = await db.prepare("SELECT * FROM songs WHERE id = ?").bind(id).first();
  if (!existingSong) {
    return c.json({ error: "Song not found" }, 404);
  }
  
  // Build dynamic update query
  const updates = [];
  const values = [];
  
  if (songData.title !== undefined) {
    updates.push("title = ?");
    values.push(songData.title);
  }
  if (songData.artist !== undefined) {
    updates.push("artist = ?");
    values.push(songData.artist);
  }
  if (songData.key_signature !== undefined) {
    updates.push("key_signature = ?");
    values.push(songData.key_signature);
  }
  if (songData.bpm !== undefined) {
    updates.push("bpm = ?");
    values.push(songData.bpm);
  }
  if (songData.tab_content !== undefined) {
    updates.push("tab_content = ?");
    values.push(songData.tab_content);
  }
  if (songData.audio_url !== undefined) {
    updates.push("audio_url = ?");
    values.push(songData.audio_url);
  }
  if (songData.duration_seconds !== undefined) {
    updates.push("duration_seconds = ?");
    values.push(songData.duration_seconds);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  await db.prepare(`UPDATE songs SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  
  const updatedSong = await db.prepare("SELECT * FROM songs WHERE id = ?").bind(id).first();
  return c.json(updatedSong);
});

// Delete a song
app.delete("/api/songs/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  
  const result = await db.prepare("DELETE FROM songs WHERE id = ?").bind(id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: "Song not found" }, 404);
  }
  
  return c.json({ success: true });
});

// Get all chord diagrams
app.get("/api/chords", async (c) => {
  const db = c.env.DB;
  const chords = await db.prepare("SELECT * FROM chord_diagrams ORDER BY chord_name").all();
  return c.json(chords.results);
});

// Get a specific chord diagram
app.get("/api/chords/:name", async (c) => {
  const db = c.env.DB;
  const name = c.req.param("name");
  const chord = await db.prepare("SELECT * FROM chord_diagrams WHERE chord_name = ?").bind(name).first();
  
  if (!chord) {
    return c.json({ error: "Chord not found" }, 404);
  }
  
  return c.json(chord);
});

export default app;
