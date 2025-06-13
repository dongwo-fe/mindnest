import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NoteController } from "../../controllers/NoteController";
import styles from "./styles.module.css";
import type { Note } from "../../types";
import TailwindAdvancedEditor from "../../components/tailwind/advanced-editor";

interface Tag {
  id: number;
  name: string;
  color: string;
}

export default function EditorPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>(null);
  const [controller, setController] = useState<NoteController | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const initController = async () => {
      try {
        const noteController = new NoteController();
        setController(noteController);
        if (noteId) {
          const foundNote = await noteController.getNoteById(parseInt(noteId));
          if (foundNote) {
            setNote(foundNote);
            setTitle(foundNote.title);
            setContent(foundNote.content);
            const noteTags = await noteController.getNoteTags(parseInt(noteId));
            setNoteTags(noteTags);
          } else {
            setError("笔记未找到");
          }
        } else if (searchParams.get("new") === "true") {
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError("初始化失败");
      } finally {
        setLoading(false);
      }
    };

    initController();
  }, [noteId, searchParams]);

  const handleCreateNote = async () => {
    if (!controller) return;

    try {
      await controller.createNote(
        "无标题",
        JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "",
                },
              ],
            },
          ],
        })
      );
      const notes = await controller.getAllNotes();
      const newNote = notes[0];
      navigate(`/editor/${newNote.id}`);
    } catch (err) {
      console.error("Error creating note:", err);
      setError("创建笔记失败");
    }
  };

  const handleAddTag = async (tagId: number) => {
    if (!controller || !note) return;

    try {
      await controller.addTagToNote(note.id, tagId);
      const updatedTags = await controller.getNoteTags(note.id);
      setNoteTags(updatedTags);
      setShowTagInput(false);
      setNewTagName("");
    } catch (err) {
      console.error("Error adding tag:", err);
      setError("添加标签失败");
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!controller || !note) return;

    try {
      await controller.removeTagFromNote(note.id, tagId);
      const updatedTags = await controller.getNoteTags(note.id);
      setNoteTags(updatedTags);
    } catch (err) {
      console.error("Error removing tag:", err);
      setError("移除标签失败");
    }
  };

  const handleCreateTag = async () => {
    if (!controller || !note || !newTagName.trim()) return;

    try {
      const tagId = await controller.createTag(newTagName);
      await handleAddTag(tagId);
    } catch (err) {
      console.error("Error creating tag:", err);
      setError("创建标签失败");
    }
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* <div>{note?.title}</div>
      <div>{note?.content}</div> */}
      <TailwindAdvancedEditor noteId={noteId}/>
    </div>
  );
}
