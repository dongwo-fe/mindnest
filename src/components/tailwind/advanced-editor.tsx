"use client";
import { defaultEditorContent } from "../../lib/content";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  ImageResizer,
  type JSONContent,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
} from "novel";
import { useEffect, useState, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";
import { NoteController } from "../../controllers/NoteController";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { slashCommand, suggestionItems } from "./slash-command";
import hljs from "highlight.js";

const extensions = [...defaultExtensions, slashCommand];

const TailwindAdvancedEditor = ({ noteId }: { noteId?: string }) => {
  const [initialContent, setInitialContent] = useState<JSONContent|null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState();
  const [controller, setController] = useState<NoteController | null>(null);
  const currentNoteIdRef = useRef<string | undefined>(noteId);
  const [editorKey, setEditorKey] = useState<string>(noteId || "default");

  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el as HTMLElement);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  useEffect(() => {
    // 如果是首次加载或noteId变化，才设置loading状态
    if (currentNoteIdRef.current !== noteId) {
      setLoading(true);
      currentNoteIdRef.current = noteId;
    }
    
    const initController = async () => {
      try {
        const noteController = new NoteController();
        setController(noteController);

        if (noteId) {
          const note = await noteController.getNoteById(parseInt(noteId));
          if (note) {
            const newContent = JSON.parse(note.content);
            setInitialContent(newContent);
            // 只有在内容加载完成后才更新editorKey，触发编辑器重新渲染
            setEditorKey(noteId);
            setLoading(false);
            return;
          }
        }

        // 如果没有找到笔记或没有noteId，则使用本地存储或默认内容
        const content = window.localStorage.getItem("novel-content");
        if (content) setInitialContent(JSON.parse(content));
        else setInitialContent(defaultEditorContent);
        setEditorKey(noteId || "default");
        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        // 如果出错，使用默认内容
        setInitialContent(defaultEditorContent);
        setEditorKey(noteId || "error");
        setLoading(false);
      }
    };

    initController();
  }, [noteId]);

  const debouncedUpdates = useDebouncedCallback(
    async (editor: EditorInstance) => {
      const json = editor.getJSON();
      setCharsCount(editor.storage.characterCount.words());

      // 从内容中提取标题（第一行文本）
      const getTitleFromContent = (content: JSONContent) => {
        if (content.content && content.content.length > 0) {
          const firstBlock = content.content[0];
          if (firstBlock.content && firstBlock.content.length > 0) {
            const firstText = firstBlock.content[0];
            if (
              firstText.type === "text" &&
              typeof firstText.text === "string"
            ) {
              return firstText.text.trim() || "无标题";
            }
          }
        }
        return "无标题";
      };

      // 保存到数据库
      if (controller && noteId) {
        try {
          const title = getTitleFromContent(json);
          await controller.updateNote(
            parseInt(noteId),
            title,
            JSON.stringify(json)
          );
          // 发布自定义事件，通知其他组件标题已更新
          const event = new CustomEvent('note-title-updated', { 
            detail: { 
              noteId: parseInt(noteId), 
              title 
            } 
          });
          window.dispatchEvent(event);
          
          setSaveStatus("Saved");
        } catch (err) {
          console.error("Error saving to database:", err);
          setSaveStatus("Error saving");
        }
      } else if (controller) {
        // 如果没有noteId，说明是新建笔记
        try {
          const title = getTitleFromContent(json);
          const newNoteId = await controller.createNote(
            title,
            JSON.stringify(json)
          );
          
          // 发布自定义事件，通知边栏刷新笔记列表
          window.dispatchEvent(new CustomEvent('refresh-notes-tree'));
          
          // 更新当前组件的noteId，避免重复创建
          if (newNoteId) {
            // 使用history API更新URL，不刷新页面
            window.history.replaceState(null, '', `/editor/${newNoteId}`);
            // 更新editorKey触发重新渲染
            setEditorKey(String(newNoteId));
            currentNoteIdRef.current = String(newNoteId);
          }
          
          setSaveStatus("Saved");
        } catch (err) {
          console.error("Error creating note:", err);
          setSaveStatus("Error saving");
        }
      }

      // 同时保存到本地存储
      window.localStorage.setItem(
        "html-content",
        highlightCodeblocks(editor.getHTML())
      );
      window.localStorage.setItem("novel-content", JSON.stringify(json));
    },
    500
  );

  if (loading && !initialContent) {
    return (
      <div className="relative w-full max-w-screen-lg flex items-center justify-center min-h-[500px]">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-screen-lg">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-lg text-gray-500">加载中...</div>
        </div>
      )}
      <div className="flex absolute right-5 top-5 z-10 mb-5 gap-2">
        <div className="rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground">
          {saveStatus}
        </div>
        <div
          className={
            charsCount
              ? "rounded-lg bg-accent px-2 py-1 text-sm text-muted-foreground"
              : "hidden"
          }
        >
          {charsCount} Words
        </div>
      </div>
      <EditorRoot>
        <EditorContent
          key={editorKey} // 使用editorKey而不是直接使用noteId
          initialContent={initialContent}
          extensions={extensions}
          className="relative min-h-[500px] w-full max-w-screen-lg border-muted bg-background sm:rounded-lg sm:border sm:shadow-lg focus-visible:outline-none"
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none focus-visible:outline-none max-w-full",
            },
          }}
          onUpdate={({ editor }) => {
            debouncedUpdates(editor);
            setSaveStatus("Unsaved");
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />
            <Separator orientation="vertical" />

            <LinkSelector open={openLink} onOpenChange={setOpenLink} />
            <Separator orientation="vertical" />
            <MathSelector />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
          </GenerativeMenuSwitch>
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default TailwindAdvancedEditor;
