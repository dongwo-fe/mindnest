import Database from '@tauri-apps/plugin-sql';
import { BaseController } from '../controllers/BaseController';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getDatabase(): Promise<Database> {
    if (!this.db) {
      this.db = await Database.load("sqlite:notes.db");
    }
    return this.db;
  }

  public async initializeDatabase(controller: BaseController): Promise<void> {
    if (!this.initialized) {
      await controller.initializeDatabase();
      this.initialized = true;
    }
  }
}

export const databaseManager = DatabaseManager.getInstance(); 