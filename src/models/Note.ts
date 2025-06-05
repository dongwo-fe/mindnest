import Database from '@tauri-apps/plugin-sql';
import { BaseModel } from './BaseModel';
import type { Note } from '../types';

export class NoteModel extends BaseModel {
  constructor(db: Database) {
    super(db);
  }

  async getAllNotes(): Promise<Note[]> {
    return await this.select<Note>(
      'SELECT id, title, content, is_favorite, created_at, updated_at, parent_id FROM notes ORDER BY created_at DESC'
    );
  }

  async createNote(title: string, content: string, parent_id: number | null = null): Promise<number> {
    const result = await this.execute(
      'INSERT INTO notes (title, content, is_favorite, parent_id) VALUES (?, ?, ?, ?)',
      [title, content, 0, parent_id]
    );
    if (!result.lastInsertId) {
      throw new Error('创建笔记失败：未获取到笔记ID');
    }
    return result.lastInsertId;
  }

  async updateNote(id: number, title: string, content: string, parent_id: number | null = null): Promise<void> {
    await this.execute(
      'UPDATE notes SET title = ?, content = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, parent_id, id]
    );
  }

  async deleteNote(id: number): Promise<void> {
    await this.execute('DELETE FROM notes WHERE id = ?', [id]);
  }

  async toggleFavorite(id: number): Promise<void> {
    await this.execute(
      'UPDATE notes SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    return await this.select<Note>(
      'SELECT id, title, content, is_favorite, created_at, updated_at, parent_id FROM notes ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
  }

  async getFavoriteNotes(): Promise<Note[]> {
    return await this.select<Note>(
      'SELECT id, title, content, is_favorite, created_at, updated_at, parent_id FROM notes WHERE is_favorite = 1 ORDER BY created_at DESC'
    );
  }

  async getNoteById(id: number): Promise<Note | null> {
    return await this.findOne<Note>(
      'SELECT id, title, content, is_favorite, created_at, updated_at, parent_id FROM notes WHERE id = ?',
      [id]
    );
  }
} 