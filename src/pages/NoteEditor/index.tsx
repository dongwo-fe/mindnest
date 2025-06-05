import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import styles from './styles.module.css';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function NoteEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: [
      'uploadVideo',
      'insertTable',
      'codeBlock',
      'todo',
      'group-video',
      'group-image',
      'group-link',
      'insertImage',
      'deleteImage',
      'editImage',
      'viewImageLink',
      'imageWidth30',
      'imageWidth50',
      'imageWidth100',
    ],
  };

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    scroll: false,
    MENU_CONF: {
      uploadImage: {
        fieldName: 'your-fileName',
        base64LimitSize: 10 * 1024 * 1024 // 10M 以下插入 base64
      }
    }
  };

  const saveNote = useCallback(async () => {
    try {
      const noteData = {
        id: id ? parseInt(id) : null,
        title,
        content: html,
      };

      await invoke('save_note', { note: noteData });
      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, [id, title, html]);

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || html) {
        saveNote();
      }
    }, 2000); // 2秒后自动保存

    return () => clearTimeout(timer);
  }, [title, html, saveNote]);

  useEffect(() => {
    if (id) {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    try {
      const note = await invoke<Note>('get_note', { id: parseInt(id!) });
      if (note) {
        setTitle(note.title);
        setHtml(note.content);
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
    }
  };

  // 组件销毁时，也及时销毁编辑器
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/')} className={styles.backButton}>
          &lt;&lt; 返回
        </button>
        {lastSaved && <span style={{ marginLeft: '20px', color: '#666', fontSize: '14px' }}>
          上次保存: {lastSaved}
        </span>}
      </div>

      <div className={styles.content}>
        <div className={styles.editorContainer}>
          <div className={styles.titleContainer}>
            <input
              type="text"
              className={styles.titleInput}
              placeholder="输入标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.editorArea}>
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              className={styles.toolbar}
            />
            <Editor
              defaultConfig={editorConfig}
              value={html}
              onCreated={setEditor}
              onChange={(editor) => setHtml(editor.getHtml())}
              mode="default"
              className={styles.editor}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 