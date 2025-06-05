import Database from '@tauri-apps/plugin-sql';
import { BaseModel } from '../models/BaseModel';

export abstract class BaseController {
  protected model!: BaseModel;
  protected db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  protected async initializeDatabase(): Promise<void> {
    try {
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_favorite INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          parent_id INTEGER DEFAULT NULL
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          color TEXT DEFAULT '#4dabf7',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS note_tags (
          note_id INTEGER,
          tag_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (note_id, tag_id),
          FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `);

      try {
        await this.db.execute('SELECT is_favorite FROM notes LIMIT 1');
      } catch {
        await this.db.execute('ALTER TABLE notes ADD COLUMN is_favorite INTEGER DEFAULT 0');
      }
    } catch (error) {
      throw new Error(`数据库初始化失败: ${error}`);
    }
  }
} 