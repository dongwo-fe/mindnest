import { BaseController } from './BaseController';
import { NoteModel } from '../models/Note';
import { TagController } from './TagController';
import type { Note, Tag, NoteWithTags } from '../types';
import { databaseManager } from '../utils/DatabaseManager';
import Database from '@tauri-apps/plugin-sql';

export class NoteController extends BaseController {
  private tagController!: TagController;
  private initialized = false;

  constructor() {
    super(null as unknown as Database);
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    const db = await databaseManager.getDatabase();
    this.db = db;
    this.model = new NoteModel(db);
    this.tagController = new TagController(db);
    await this.initializeDatabase();
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getAllNotes(): Promise<Note[]> {
    await this.ensureInitialized();
    return this.model.getAllNotes();
  }

  async createNote(title: string, content: string, parent_id: number | null = null): Promise<number> {
    await this.ensureInitialized();
    return this.model.createNote(title, content, parent_id);
  }

  async updateNote(id: number, title: string, content: string, parent_id: number | null = null): Promise<void> {
    await this.ensureInitialized();
    await this.model.updateNote(id, title, content, parent_id);
  }

  async deleteNote(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.model.deleteNote(id);
  }

  async toggleFavorite(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.model.toggleFavorite(id);
  }

  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    await this.ensureInitialized();
    return this.model.getRecentNotes(limit);
  }

  async getFavoriteNotes(): Promise<Note[]> {
    await this.ensureInitialized();
    return this.model.getFavoriteNotes();
  }

  async getNoteById(id: number): Promise<Note | null> {
    await this.ensureInitialized();
    return this.model.getNoteById(id);
  }

  async getNoteTags(noteId: number): Promise<Tag[]> {
    await this.ensureInitialized();
    return this.tagController.getNoteTags(noteId);
  }

  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    await this.ensureInitialized();
    await this.tagController.addTagToNote(noteId, tagId);
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    await this.ensureInitialized();
    await this.db.execute(
      "DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?",
      [noteId, tagId]
    );
  }

  async getNotesWithTags(): Promise<NoteWithTags[]> {
    await this.ensureInitialized();
    const notes = await this.getAllNotes();
    const notesWithTags = await Promise.all(
      notes.map(async (note) => {
        const tags = await this.getNoteTags(note.id);
        return { ...note, tags };
      })
    );
    return notesWithTags;
  }

  async clearDatabase(): Promise<void> {
    await this.ensureInitialized();
    await this.db.execute("DELETE FROM note_tags");
    await this.db.execute("DELETE FROM notes");
    await this.db.execute("DELETE FROM tags");
  }
}