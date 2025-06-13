import { NoteModel } from '../models/Note';
import type { NoteData } from '../types';
import { DatabaseManager } from '../utils/DatabaseManager';

// 分页参数接口
interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果接口
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class NoteController {
  private constructor(private model: NoteModel) {}

  static async create(): Promise<NoteController> {
    const db = await DatabaseManager.getInstance().getDatabase();
    const model = new NoteModel(db);
    return new NoteController(model);
  }

  // 获取分页笔记列表
  async getNotesByPage(params: PaginationParams): Promise<PaginatedResult<NoteData>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      this.model.findByPage(offset, pageSize),
      this.model.getTotalCount()
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total
    };
  }

  // 搜索笔记（带分页）
  async searchNotes(query: string, params: PaginationParams): Promise<PaginatedResult<NoteData>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      this.model.search(query, offset, pageSize),
      this.model.getSearchCount(query)
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total
    };
  }

  // 获取最近笔记（带分页）
  async getRecentNotesByPage(params: PaginationParams): Promise<PaginatedResult<NoteData>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      this.model.getRecentNotesByPage(offset, pageSize),
      this.model.getTotalCount()
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total
    };
  }

  // 获取收藏笔记（带分页）
  async getFavoriteNotesByPage(params: PaginationParams): Promise<PaginatedResult<NoteData>> {
    const { page, pageSize } = params;
    const offset = (page - 1) * pageSize;
    
    const [items, total] = await Promise.all([
      this.model.getFavoriteNotesByPage(offset, pageSize),
      this.model.getFavoriteCount()
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total
    };
  }

  // 笔记相关业务逻辑
  async getAllNotes(): Promise<NoteData[]> {
    return await this.model.findAll();
  }

  async createNote(data: Omit<NoteData, 'id' | 'created_at' | 'updated_at'>): Promise<NoteData> {
    const note = await this.model.create(data);
    return note as NoteData;
  }

  async updateNote(id: number, data: Partial<NoteData>): Promise<NoteData> {
    const note = await this.model.update(id, data);
    return note as NoteData;
  }

  async deleteNote(id: number): Promise<void> {
    await this.model.delete(id);
  }

  async toggleFavorite(id: number): Promise<void> {
    await this.model.toggleFavorite(id);
  }

  async getNoteById(id: number): Promise<NoteData | null> {
    return await this.model.findById(id);
  }

  async getRecentNotes(limit: number = 10): Promise<NoteData[]> {
    return await this.model.getRecentNotes(limit);
  }

  async getFavoriteNotes(): Promise<NoteData[]> {
    return await this.model.getFavoriteNotes();
  }

  async clearDatabase(): Promise<void> {
    await DatabaseManager.getInstance().clearDatabase();
  }
}