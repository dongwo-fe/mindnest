import Database from "@tauri-apps/plugin-sql";
import type { NoteData } from "../types";

export class NoteModel {
  constructor(private db: Database) {}

  // 基础数据库操作
  async findAll(
    orderBy: { column: string; direction: "ASC" | "DESC" } = {
      column: "updated_at",
      direction: "DESC",
    }
  ): Promise<NoteData[]> {
    const sql = `SELECT * FROM notes ORDER BY ${orderBy.column} ${orderBy.direction}`;
    const result = await this.db.select(sql) as unknown[];
    return (result || []) as NoteData[];
  }

  async findById(id: number): Promise<NoteData | null> {
    const sql = `SELECT * FROM notes WHERE id = ?`;
    const result = await this.db.select(sql, [id]) as unknown[];
    if (!result || result.length === 0) return null;
    return result[0] as NoteData;
  }

  async create(
    data: Omit<NoteData, "id" | "created_at" | "updated_at">
  ): Promise<NoteData> {
    const result = await this.db.execute(
      `INSERT INTO notes (title, content, html_content, is_favorite, parent_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.title,
        data.content,
        data.html_content,
        data.is_favorite ? 1 : 0,
        data.parent_id,
      ]
    );

    if (!result.lastInsertId) {
      throw new Error("创建笔记失败：未获取到笔记ID");
    }
    const newNote = await this.findById(result.lastInsertId);
    if (!newNote) {
      throw new Error("创建笔记失败：无法获取新创建的笔记");
    }
    return newNote;
  }

  async update(id: number, data: Partial<NoteData>): Promise<NoteData> {
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push("content = ?");
      values.push(data.content);
    }
    if (data.html_content !== undefined) {
      updates.push("html_content = ?");
      values.push(data.html_content);
    }
    if (data.is_favorite !== undefined) {
      updates.push("is_favorite = ?");
      values.push(data.is_favorite ? 1 : 0);
    }
    if (data.parent_id !== undefined) {
      updates.push("parent_id = ?");
      values.push(data.parent_id);
    }

    if (updates.length === 0) {
      const existingNote = await this.findById(id);
      if (!existingNote) {
        throw new Error("笔记不存在");
      }
      return existingNote;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await this.db.execute(
      `UPDATE notes SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const updatedNote = await this.findById(id);
    if (!updatedNote) {
      throw new Error("更新笔记失败：无法获取更新后的笔记");
    }
    return updatedNote;
  }

  async delete(id: number): Promise<void> {
    await this.db.execute("DELETE FROM notes WHERE id = ?", [id]);
  }

  async toggleFavorite(id: number): Promise<void> {
    await this.db.execute(
      "UPDATE notes SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }

  // 高级查询方法
  async getRecentNotes(limit: number = 10): Promise<NoteData[]> {
    const sql = `SELECT * FROM notes ORDER BY updated_at DESC LIMIT ?`;
    const result = (await this.db.select(sql, [limit])) as { rows: unknown[] };
    return (result.rows || []) as NoteData[];
  }

  async getFavoriteNotes(): Promise<NoteData[]> {
    const sql = `SELECT * FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC`;
    const result = (await this.db.select(sql)) as { rows: unknown[] };
    return (result.rows || []) as NoteData[];
  }

  // 分页获取笔记列表
  async findByPage(offset: number, limit: number): Promise<NoteData[]> {
    const sql = `
      SELECT * FROM notes 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    const result = await this.db.select(sql, [limit, offset]) as unknown[];
    return result as NoteData[];
  }

  // 获取笔记总数
  async getTotalCount(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM notes';
    const result = await this.db.select(sql) as unknown[];
    return (result[0] as { count: number }).count;
  }

  // 搜索笔记（带分页）
  async search(query: string, offset: number, limit: number): Promise<NoteData[]> {
    const sql = `
      SELECT * FROM notes 
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    const searchPattern = `%${query}%`;
    const result = await this.db.select(sql, [searchPattern, searchPattern, limit, offset]) as unknown[];
    return result as NoteData[];
  }

  // 获取搜索结果总数
  async getSearchCount(query: string): Promise<number> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM notes 
      WHERE title LIKE ? OR content LIKE ?
    `;
    const searchPattern = `%${query}%`;
    const result = await this.db.select(sql, [searchPattern, searchPattern]) as unknown[];
    return (result[0] as { count: number }).count;
  }

  // 分页获取最近笔记
  async getRecentNotesByPage(offset: number, limit: number): Promise<NoteData[]> {
    const sql = `
      SELECT * FROM notes 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    const result = await this.db.select(sql, [limit, offset]) as unknown[];
    return result as NoteData[];
  }

  // 分页获取收藏笔记
  async getFavoriteNotesByPage(offset: number, limit: number): Promise<NoteData[]> {
    const sql = `
      SELECT * FROM notes 
      WHERE is_favorite = 1 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    const result = await this.db.select(sql, [limit, offset]) as unknown[];
    return result as NoteData[];
  }

  // 获取收藏笔记总数
  async getFavoriteCount(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM notes WHERE is_favorite = 1';
    const result = await this.db.select(sql) as unknown[];
    return (result[0] as { count: number }).count;
  }
}
