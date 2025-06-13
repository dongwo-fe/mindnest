import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Database from "@tauri-apps/plugin-sql";
import { NoteController } from "../../controllers/NoteController";
import type { Note } from "../../models/Note";
import styles from "./styles.module.css";
import { appDataDir } from "@tauri-apps/api/path";

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface NoteWithTags extends Note {
  tags: Tag[];
}

export default function Home() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controller, setController] = useState<NoteController | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const initController = async () => {
      try {
       

        const noteController = new NoteController();
        setController(noteController);
        const notesWithTags = await noteController.getNotesWithTags();
        setNotes(notesWithTags);
      } catch (err) {
        console.error("Error initializing:", err);
        setError("初始化失败");
      } finally {
        setLoading(false);
      }
    };

    initController();
  }, []);

  const handleClearDatabase = async () => {
    if (!controller) return;
    try {
      await controller.clearDatabase();
      setNotes([]);
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Error clearing database:", err);
      setError("清空数据库失败");
    }
  };

  const handleCreateNote = async () => {
    if (!controller) {
      setError("控制器未初始化");
      return;
    }

    try {
      await controller.createNote("", "");
      const notes = await controller.getAllNotes();
      const newNote = notes[0]; // 获取最新创建的笔记
      navigate(`/editor/${newNote.id}?isEditing=true`);
    } catch (err) {
      console.error("Error creating note:", err);
      setError("创建笔记失败");
    }
  };

  const handleNoteClick = (noteId: number) => {
    navigate(`/editor/${noteId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>我的笔记</h1>
          <div className={styles.actions}>
            <button onClick={() => navigate("/editor?new=true")}>
              新建笔记
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className={styles.dangerButton}
            >
              清空数据库
            </button>
          </div>
        </div>
        <div className={styles.content}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>我的笔记</h1>
          <div className={styles.actions}>
            <button onClick={() => navigate("/editor?new=true")}>
              新建笔记
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className={styles.dangerButton}
            >
              清空数据库
            </button>
          </div>
        </div>
        <div className={styles.content}>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>我的笔记</h1>
        <div className={styles.actions}>
          <button onClick={handleCreateNote}>新建笔记</button>
          <button
            onClick={() => setShowConfirmDialog(true)}
            className={styles.dangerButton}
          >
            清空数据库
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <div className={styles.confirmDialog}>
          <div className={styles.confirmContent}>
            <h3>确认清空数据库？</h3>
            <p>此操作将删除所有笔记和标签，且不可恢复。</p>
            <div className={styles.confirmActions}>
              <button
                onClick={handleClearDatabase}
                className={styles.dangerButton}
              >
                确认清空
              </button>
              <button onClick={() => setShowConfirmDialog(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {notes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>还没有笔记，点击右上角按钮创建第一篇笔记</p>
          </div>
        ) : (
          <div className={styles.noteList}>
            {notes.map((note) => (
              <div
                key={note.id}
                className={styles.noteItem}
                onClick={() => handleNoteClick(note.id)}
              >
                <h2>{note.title}</h2>
                <div className={styles.tagsList}>
                  {note.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={styles.tag}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <div className={styles.noteMeta}>
                  <span>
                    创建时间：{new Date(note.created_at).toLocaleString()}
                  </span>
                  {note.updated_at && (
                    <span>
                      {" "}
                      | 更新时间：{new Date(note.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div
                  className={styles.notePreview}
                  dangerouslySetInnerHTML={{
                    __html:
                      note.content.replace(/<[^>]+>/g, "").slice(0, 200) +
                      "...",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
