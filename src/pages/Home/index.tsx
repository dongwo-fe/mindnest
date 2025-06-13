import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NoteController } from "../../controllers/NoteController";
import type { NoteData } from "../../types";
import styles from "./styles.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  // 加载笔记
  const loadNotes = async (pageNum: number, append: boolean = false) => {
    try {
      const noteController = await NoteController.create();
      const result = await noteController.getNotesByPage({
        page: pageNum,
        pageSize
      });

      setHasMore(result.hasMore);
      if (append) {
        setNotes(prev => [...prev, ...result.items]);
      } else {
        setNotes(result.items);
      }
    } catch (err) {
      console.error("Error loading notes:", err);
      setError("加载笔记失败");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadNotes(1);
  }, []);

  // 处理滚动加载
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotes(nextPage, true);
    }
  }, [isLoadingMore, hasMore, page]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  const handleNoteClick = (id: number) => {
    navigate(`/editor/${id}`);
  };

  const handleCreateNote = () => {
    navigate("/editor");
  };

  if (loading && notes.length === 0) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error && notes.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h1>我的笔记</h1>
        <button className={styles.createButton} onClick={handleCreateNote}>
          新建笔记
        </button>
      </div>
      <div className={styles.notesGrid}>
        {notes.map((note) => (
          <div
            key={note.id}
            className={styles.noteCard}
            onClick={() => handleNoteClick(note.id)}
          >
            <h2 className={styles.noteTitle}>{note.title}</h2>
            <div 
              className={styles.noteContent}
              dangerouslySetInnerHTML={{ __html: note.html_content || '' }}
            />
            <div className={styles.noteMeta}>
              <span className={styles.noteDate}>
                {new Date(note.updated_at).toLocaleString()}
              </span>
              {note.is_favorite && (
                <span className={styles.favoriteIcon}>★</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isLoadingMore && (
        <div className={styles.loadingMore}>加载中...</div>
      )}
      {!hasMore && notes.length > 0 && (
        <div className={styles.noMore}>没有更多笔记了</div>
      )}
    </div>
  );
}
