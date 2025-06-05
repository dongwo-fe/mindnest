import Database from '@tauri-apps/plugin-sql';
import type { QueryResult } from '@tauri-apps/plugin-sql';
import type { Note } from '../types';

export abstract class BaseModel {
  protected db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  protected async execute(sql: string, params: unknown[] = []): Promise<QueryResult> {
    try {
      return await this.db.execute(sql, params);
    } catch (error) {
      throw new Error(`数据库操作失败: ${error}`);
    }
  }

  protected async select<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      return await this.db.select(sql, params);
    } catch (error) {
      throw new Error(`数据库查询失败: ${error}`);
    }
  }

  protected async findOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    try {
      const results = await this.db.select<T[]>(sql, params);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`数据库查询失败: ${error}`);
    }
  }

  abstract getAllNotes(): Promise<Note[]>;
  abstract createNote(title: string, content: string): Promise<number>;
  abstract updateNote(id: number, title: string, content: string): Promise<void>;
  abstract deleteNote(id: number): Promise<void>;
  abstract toggleFavorite(id: number): Promise<void>;
  abstract getRecentNotes(limit: number): Promise<Note[]>;
  abstract getFavoriteNotes(): Promise<Note[]>;
  abstract getNoteById(id: number): Promise<Note | null>;
} 