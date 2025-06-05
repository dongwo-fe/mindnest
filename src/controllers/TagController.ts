import Database from '@tauri-apps/plugin-sql';
import { BaseController } from './BaseController';
import { TagModel } from '../models/Tag';
import type { Tag } from '../types';

export class TagController extends BaseController {
  private tagModel: TagModel;

  constructor(db: Database) {
    super(db);
    this.tagModel = new TagModel(db);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.tagModel.getAllTags();
  }

  async createTag(name: string, color: string = '#4dabf7'): Promise<number> {
    return this.tagModel.createTag(name, color);
  }

  async getNoteTags(noteId: number): Promise<Tag[]> {
    return this.tagModel.getNoteTags(noteId);
  }

  async addTagToNote(noteId: number, tagId: number): Promise<void> {
    await this.tagModel.addTagToNote(noteId, tagId);
  }

  async removeTagFromNote(noteId: number, tagId: number): Promise<void> {
    await this.tagModel.removeTagFromNote(noteId, tagId);
  }

  async getRecentTags(limit: number = 5): Promise<Tag[]> {
    return this.tagModel.getRecentTags(limit);
  }
} 