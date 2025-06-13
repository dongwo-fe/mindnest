import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { NoteController } from "../../controllers/NoteController";
import styles from "./styles.module.css";
import TailwindAdvancedEditor from "../../components/tailwind/advanced-editor";

export default function EditorPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initController = async () => {
      try {
        const noteController = await NoteController.create();
        if (noteId) {
          const note = await noteController.getNoteById(parseInt(noteId));
          if (!note) {
            setError("笔记不存在");
          }
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError("初始化失败");
      }
    };

    initController();
  }, [noteId]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <TailwindAdvancedEditor noteId={noteId} />
    </div>
  );
}
