import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NoteController } from "../../controllers/NoteController";
import styles from "./styles.module.css";

// 定义本地使用的Note接口
interface Note {
  id: number;
  title: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  parent_id: number | null;
  is_favorite?: number;
  children: Note[];
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 构建树形结构
  function buildTree(flatNotes: {id: number, title: string, parent_id: number | null}[]): Note[] {
    // 将扁平笔记转换为带有children数组的笔记
    const notesWithChildren = flatNotes.map(note => ({
      ...note,
      children: []
    }));
    
    // 使用ID映射所有笔记，方便查找
    const noteMap = new Map<number, Note>();
    notesWithChildren.forEach(note => {
      noteMap.set(note.id, note as Note);
    });
    
    // 创建树结构
    const roots: Note[] = [];
    notesWithChildren.forEach(note => {
      const parentId = note.parent_id;
      if (parentId !== null && noteMap.has(parentId)) {
        // 有父节点，添加到父节点的children中
        const parent = noteMap.get(parentId)!;
        parent.children.push(noteMap.get(note.id)!);
      } else {
        // 没有父节点或父节点不存在，作为根节点
        roots.push(noteMap.get(note.id)!);
      }
    });
    
    return roots;
  }

  // 刷新笔记树
  const refreshNotes = async () => {
    try {
      setLoading(true);
      const noteController = await NoteController.create();
      const flatNotes = await noteController.getAllNotes();
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

  // 监听标题更新事件
  useEffect(() => {
    const handleTitleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{noteId: number, title: string}>;
      const { noteId, title } = customEvent.detail;
      
      // 更新笔记树中的标题
      setNotes(prevNotes => {
        // 创建一个深拷贝的函数，用于更新树中的标题
        const updateTitleInTree = (nodes: Note[]): Note[] => {
          return nodes.map(node => {
            if (node.id === noteId) {
              return { ...node, title };
            }
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: updateTitleInTree(node.children)
              };
            }
            return node;
          });
        };
        
        return updateTitleInTree(prevNotes);
      });
    };
    
    // 监听刷新笔记树事件
    const handleRefreshNotes = () => {
      console.log("[边栏] 收到刷新笔记树事件");
      refreshNotes();
    };
    
    window.addEventListener('note-title-updated', handleTitleUpdate);
    window.addEventListener('refresh-notes-tree', handleRefreshNotes);
    
    return () => {
      window.removeEventListener('note-title-updated', handleTitleUpdate);
      window.removeEventListener('refresh-notes-tree', handleRefreshNotes);
    };
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
    try {
      const noteController = new NoteController();
      await noteController.createNote("无标题文档", "", parentId);
      await refreshNotes();
    } catch (error) {
      console.error("创建子笔记失败:", error);
    }
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
              {renderTree(node.children || [], level < 5 ? level + 1 : 5)}
            </ul>
          )}
        </li>
      );
    });
  }

  // 搜索笔记
  const searchNotes = (query: string, pageNum = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setHasMore(false);
      return;
    }

    setIsSearching(true);
    const pageSize = 10;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const allResults = notes.filter(note => {
      const searchStr = `${note.title} ${note.content || ''}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    });

    const paginatedResults = allResults.slice(startIndex, endIndex);
    setHasMore(endIndex < allResults.length);

    if (pageNum === 1) {
      setSearchResults(paginatedResults);
    } else {
      setSearchResults(prev => [...prev, ...paginatedResults]);
    }
  };

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(1);
    searchNotes(query, 1);
  };

  // 处理搜索结果的点击
  const handleSearchResultClick = (noteId: number) => {
    navigate(`/editor/${noteId}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // 处理滚动加载
  const handleScroll = useCallback(() => {
    if (!searchResultsRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = searchResultsRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      searchNotes(searchQuery, nextPage);
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, searchQuery]);

  // 监听滚动事件
  useEffect(() => {
    const searchResultsElement = searchResultsRef.current;
    if (searchResultsElement) {
      searchResultsElement.addEventListener('scroll', handleScroll);
      return () => {
        searchResultsElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.sidebar} ${
          isSidebarExpanded ? styles.expanded : styles.collapsed
        }`}
        style={{ width: isSidebarExpanded ? sidebarWidth : 64 }}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearching && (
              <div className={styles.searchResults} ref={searchResultsRef}>
                {searchResults.map(note => (
                  <div
                    key={note.id}
                    className={styles.searchResultItem}
                    onClick={() => handleSearchResultClick(note.id)}
                  >
                    <div className={styles.searchResultTitle}>{note.title}</div>
                    <div className={styles.searchResultPreview}>
                      {note.content?.replace(/<[^>]+>/g, "").slice(0, 50)}...
                    </div>
                  </div>
                ))}
                {isLoadingMore && (
                  <div className={styles.loadingMore}>加载中...</div>
                )}
                {!hasMore && searchResults.length > 0 && (
                  <div className={styles.noMore}>没有更多结果了</div>
                )}
              </div>
            )}
          </div>
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
            style={{ display: 'flex' }}
          >
            <span className={styles.icon} style={{ display: 'inline-block' }}>⚙️</span>
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
