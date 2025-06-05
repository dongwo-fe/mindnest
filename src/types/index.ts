export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  is_favorite: number;
  children?: Note[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
} 