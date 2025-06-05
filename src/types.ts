export interface Note {
  id: number;
  title: string;
  content: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
} 