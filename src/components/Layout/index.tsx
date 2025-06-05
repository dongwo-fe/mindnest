import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Database from "@tauri-apps/plugin-sql";
import { NoteController } from "../../controllers/NoteController";
import styles from "./styles.module.css";


interface Note {
  id: number;
  title: string;
  parent_id: number | null;
  children?: Note[];
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // 构建树形结构
  function buildTree(flatNotes: Note[]): Note[] {
    const map = new Map<number, Note & { children: Note[] }>();
    const roots: Note[] = [];
    flatNotes.forEach((note) => map.set(note.id, { ...note, children: [] }));
    flatNotes.forEach((note) => {
      if (note.parent_id && map.has(note.parent_id)) {
        map.get(note.parent_id)!.children.push(map.get(note.id)!);
      } else {
        roots.push(map.get(note.id)!);
      }
    });
    return roots;
  }

  // 刷新笔记树
  const refreshNotes = async () => {
    try {
      setLoading(true);
      const noteController = new NoteController();
      const flatNotes: Note[] = await noteController.getAllNotes();
      const tree = buildTree(flatNotes);
      console.log("[边栏] 当前目录树结构:", tree);
      setNotes(tree);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshNotes();
  }, []);

  // 处理快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setIsSidebarExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 处理拖拽调整宽度
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isSidebarExpanded) return;
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleDrag = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(180, Math.min(320, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };
    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
    };
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  // 处理双击切换
  const handleDoubleClick = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  // 判断是否为首页
  const isHome = location.pathname === "/";

  // 新建子笔记
  const handleAddChildNote = async (parentId: number, level: number) => {
    if (level + 1 > 5) {
      alert("最多支持5层子级笔记，无法继续新建子笔记。");
      return;
    }
    console.log(`[边栏] 新建子笔记，父ID: ${parentId}`);
    const db = await Database.load("sqlite:notes.db");
    const noteController = new NoteController(db);
    await noteController.createNote("无标题文档", "", parentId);
    await refreshNotes();
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 递归渲染树
  function renderTree(nodes: Note[], level = 1) {
  return nodes.map((node) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = expandedIds.has(node.id);
    return (
      <li
        key={node.id}
        className={`${styles.treeItem} ${styles[`level-${level}`]}`}
        style={{ margin: '4px 0', position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minHeight: '32px' }}>
          {hasChildren ? (
            <span
              className={`${styles.arrow} ${expanded ? styles.open : ''}`}
              onClick={e => { e.stopPropagation(); toggleExpand(node.id); }}
            >▶</span>
          ) : (
            <span style={{ display: 'inline-block', width: '16px' }}></span>
          )}
          <span
            className={styles.title}
            onClick={() => navigate(`/editor/${node.id}`)}
          >{node.title || '无标题文档'}</span>
          <button
            className={styles.addChildBtn}
            title="在此下方新建子文档"
            onClick={e => { e.stopPropagation(); handleAddChildNote(node.id, level); }}
            style={{ alignSelf: 'center' }}
          >
            ＋
          </button>
        </div>
        {hasChildren && expanded && (
          <ul className={styles.tree} style={{ marginLeft: '4px', paddingLeft: '0', marginTop: '0' }}>
            {renderTree(node.children, level < 5 ? level + 1 : 5)}
          </ul>
        )}
      </li>
    );
  });
  }

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.sidebar} ${
          isSidebarExpanded ? styles.expanded : styles.collapsed
        }`}
        style={{ width: isSidebarExpanded ? sidebarWidth : 64 }}
      >
        <div className={styles.sidebarHeader}>
          <input
            type="search"
            placeholder="搜索"
            className={styles.sidebarSearchInput}
          />
          <button
            className={`${styles.homeButton} ${isHome ? styles.selected : ""}`}
            onClick={() => navigate("/")}
          >
            <span className={styles.homeIcon}>🏠</span>
            {isSidebarExpanded && <span className={styles.homeText}>首页</span>}
          </button>
        </div>

        <div className={styles.sidebarContent}>
          {loading ? (
            <div className={styles.emptyState}>加载中...</div>
          ) : notes.length === 0 ? (
            <div className={styles.emptyState}>
              <img src="/empty-note.svg" alt="空状态" />
              <div>
                知识库为空，你可以
                <a href="#" onClick={() => navigate("/editor?new=true")}>
                  新建文档
                </a>
              </div>
            </div>
          ) : (
            <ul className={styles.tree}>
              <li
                className={styles.treeItem}
                style={{
                  color: "#888",
                  fontWeight: 500,
                  fontSize: "15px",
                  marginBottom: "4px",
                  cursor: "default",
                }}
              >
                目录
              </li>
              {renderTree(notes, 1)}
            </ul>
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.toolbarButton}
            onClick={() => {
              console.log("[边栏] 新建一级笔记");
              navigate("/editor?new=true");
            }}
            title="新建笔记"
          >
            <span className={styles.icon}>+</span>
          </button>
          <button
            className={styles.toolbarButton}
            onClick={() => navigate("/settings")}
            title="设置"
          >
            <span className={styles.icon}>⚙️</span>
          </button>
        </div>

        <div
          className={styles.sidebarResizer}
          onMouseDown={handleDragStart}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      <div className={styles.main}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
