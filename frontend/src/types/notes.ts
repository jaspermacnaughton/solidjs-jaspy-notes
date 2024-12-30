export interface Note {
  note_id: number;
  title: string;
  body: string;
  subitems: Subitem[];
} 

export interface Subitem {
  subitem_id?: number;
  note_id: number;
  text: string;
  is_checked: boolean;
}