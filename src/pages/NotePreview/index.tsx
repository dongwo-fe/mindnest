import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import type { Note } from '../../types';
import styles from './styles.module.css';

export default function NotePreview() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const result = await invoke<Note>('get_note', { id: noteId });
        setNote(result);
        setError(null);
      } catch (err) {
        setError('加载笔记失败');
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const handleEdit = () => {
    if (noteId) {
      navigate(`/editor/${noteId}`);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;

    try {
      await invoke('delete_note', { id: noteId });
      navigate('/');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('删除笔记失败');
    }
  };

  if (loading) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← 返回
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.previewContent}>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/')}>
            ← 返回
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.previewContent}>
            <p>{error || '笔记不存在'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.previewContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← 返回
        </button>
        <div className={styles.actions}>
          <button className={styles.editButton} onClick={handleEdit}>
            编辑
          </button>
          <button className={styles.deleteButton} onClick={handleDelete}>
            删除
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.previewContent}>
          <h1>{note.title}</h1>
          <div className={styles.meta}>
            <span>创建时间：{new Date(note.created_at).toLocaleString()}</span>
            {note.updated_at && (
              <span> | 更新时间：{new Date(note.updated_at).toLocaleString()}</span>
            )}
          </div>
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </div>
      </div>
    </div>
  );
} 