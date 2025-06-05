import { useState, useEffect } from 'react';
import Database from '@tauri-apps/plugin-sql';
import styles from './styles.module.css';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function DatabaseTest() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [db, setDb] = useState<Database | null>(null);

  // 初始化数据库连接
  useEffect(() => {
    const initDb = async () => {
      try {
        const database = await Database.load('sqlite:notes.db');
        setDb(database);
        
        // 创建表
        await database.execute(`
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        fetchNotes(database);
      } catch (error) {
        setMessage(`数据库初始化失败: ${error}`);
      }
    };

    initDb();
  }, []);

  // 获取所有笔记
  const fetchNotes = async (database: Database) => {
    try {
      setLoading(true);
      const result = await database.select<Note[]>(
        'SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC'
      );
      setNotes(result);
      setMessage('获取笔记成功');
    } catch (error) {
      setMessage(`获取笔记失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 创建新笔记
  const createNote = async () => {
    if (!db) {
      setMessage('数据库未初始化');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setMessage('标题和内容不能为空');
      return;
    }

    try {
      setLoading(true);
      await db.execute(
        'INSERT INTO notes (title, content) VALUES (?, ?)',
        [title, content]
      );
      setTitle('');
      setContent('');
      setMessage('创建笔记成功');
      await fetchNotes(db);
    } catch (error) {
      setMessage(`创建笔记失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除笔记
  const deleteNote = async (id: number) => {
    if (!db) {
      setMessage('数据库未初始化');
      return;
    }

    try {
      setLoading(true);
      await db.execute('DELETE FROM notes WHERE id = ?', [id]);
      setMessage('删除笔记成功');
      await fetchNotes(db);
    } catch (error) {
      setMessage(`删除笔记失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>数据库测试</h2>
      
      <div className={styles.form}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className={styles.input}
          disabled={loading}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="内容"
          className={styles.textarea}
          disabled={loading}
        />
        <button 
          onClick={createNote} 
          className={styles.button}
          disabled={loading || !db}
        >
          {loading ? '处理中...' : '创建笔记'}
        </button>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.notes}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <div className={styles.meta}>
                <span>创建时间: {new Date(note.created_at).toLocaleString()}</span>
                <span>更新时间: {new Date(note.updated_at).toLocaleString()}</span>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className={styles.deleteButton}
                disabled={loading || !db}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 