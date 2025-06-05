import Database from '@tauri-apps/plugin-sql';
import { BaseModel } from './BaseModel';
import type { Tag } from '../types';

export class TagModel extends BaseModel {
  constructor(db: Database) {
    super(db);
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.select<Tag>(
      'SELECT id, name, color FROM tags ORDER BY name'
    );
  }

  async createTag(name: string, color: string = '#4dabf7'): Promise<number> {
    const result = await this.execute(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name, color]
    );
    if (!result.lastInsertId) {
      throw new Error('创建标签失败：未获取到标签ID');
    }
    return result.lastInsertId;
  }

  async getNoteTags(noteId: number): Promise<Tag[]> {
    return await this.select<Tag>(
      `SELECT t.id, t.name, t.color 
       FROM tags t 
       JOIN note_tags nt ON t.id = nt.tag_id 
       WHERE nt.note_id = ? 
       ORDER BY t.name`,
      [noteId]
    );
  }

  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    await this.execute(
      'INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
      [noteId, tagId]
    );
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    await this.execute(
      'DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?',
      [noteId, tagId]
    );
  }

  async getRecentTags(limit: number = 5): Promise<Tag[]> {
    return await this.select<Tag>(
      `SELECT t.id, t.name, t.color 
       FROM tags t 
       JOIN note_tags nt ON t.id = nt.tag_id 
       GROUP BY t.id 
       ORDER BY MAX(nt.created_at) DESC 
       LIMIT ?`,
      [limit]
    );
  }

  // 实现 BaseModel 的抽象方法
  async getAllNotes(): Promise<never[]> {
    throw new Error('TagModel 不支持 getAllNotes 方法');
  }

  async createNote(): Promise<never> {
    throw new Error('TagModel 不支持 createNote 方法');
  }

  async updateNote(): Promise<never> {
    throw new Error('TagModel 不支持 updateNote 方法');
  }

  async deleteNote(): Promise<never> {
    throw new Error('TagModel 不支持 deleteNote 方法');
  }

  async toggleFavorite(): Promise<never> {
    throw new Error('TagModel 不支持 toggleFavorite 方法');
  }

  async getRecentNotes(): Promise<never[]> {
    throw new Error('TagModel 不支持 getRecentNotes 方法');
  }

  async getFavoriteNotes(): Promise<never[]> {
    throw new Error('TagModel 不支持 getFavoriteNotes 方法');
  }

  async getNoteById(): Promise<never> {
    throw new Error('TagModel 不支持 getNoteById 方法');
  }
} 