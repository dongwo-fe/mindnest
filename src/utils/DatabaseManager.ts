import Database from '@tauri-apps/plugin-sql';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getDatabase(): Promise<Database> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db;
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    await this.db.execute('DELETE FROM notes');
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await Database.load('sqlite:notes.db');
      await this.initializeTables();
      this.initialized = true;
    } catch (error) {
      throw new Error(`数据库初始化失败: ${error}`);
    }
  }

  private async initializeTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未连接');

    try {
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          html_content TEXT,
          is_favorite INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          parent_id INTEGER DEFAULT NULL
        )
      `);
    } catch (error) {
      throw new Error(`数据库表初始化失败: ${error}`);
    }
  }
}

export const databaseManager = DatabaseManager.getInstance(); 