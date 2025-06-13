export interface Note {
  id: number;
  title: string;
  content: string;
  html_content?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  tags: Tag[];
}

export interface NoteData {
  id: number;
  title: string;
  content: string;
  html_content?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface NoteWithTags extends NoteData {
} 