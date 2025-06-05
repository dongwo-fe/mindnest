import Database from '@tauri-apps/plugin-sql';

interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

class NoteDatabase {
  private db: Database | null = null;

  async init() {
    if (!this.db) {
      this.db = await Database.load('sqlite:notes.db');
      await this.createTables();
    }
  }

  private async createTables() {
    await this.db?.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  async createNote(note: Omit<Note, 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    await this.db?.execute(
      `INSERT INTO notes (id, title, content, category, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [note.id, note.title, note.content, note.category || null, note.is_favorite ? 1 : 0, now, now]
    );
  }

  async updateNote(note: Partial<Note> & { id: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (note.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(note.title);
      paramIndex++;
    }

    if (note.content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(note.content);
      paramIndex++;
    }

    if (note.category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(note.category);
      paramIndex++;
    }

    if (note.is_favorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex}`);
      values.push(note.is_favorite ? 1 : 0);
      paramIndex++;
    }

    updates.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    values.push(note.id);

    await this.db?.execute(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  async deleteNote(id: string) {
    await this.db?.execute('DELETE FROM notes WHERE id = $1', [id]);
  }

  async getNote(id: string): Promise<Note | null> {
    const result = await this.db?.select<Note[]>(
      'SELECT * FROM notes WHERE id = $1',
      [id]
    );
    return result?.[0] || null;
  }

  async getAllNotes(): Promise<Note[]> {
    return await this.db?.select<Note[]>(
      'SELECT * FROM notes ORDER BY updated_at DESC'
    ) || [];
  }

  async getNotesByCategory(category: string): Promise<Note[]> {
    return await this.db?.select<Note[]>(
      'SELECT * FROM notes WHERE category = $1 ORDER BY updated_at DESC',
      [category]
    ) || [];
  }

  async getFavoriteNotes(): Promise<Note[]> {
    return await this.db?.select<Note[]>(
      'SELECT * FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC'
    ) || [];
  }

  async searchNotes(keyword: string): Promise<Note[]> {
    return await this.db?.select<Note[]>(
      `SELECT * FROM notes 
       WHERE title LIKE $1 OR content LIKE $1 
       ORDER BY updated_at DESC`,
      [`%${keyword}%`]
    ) || [];
  }
}

export const noteDb = new NoteDatabase(); 