export interface Note {
  note_id: number;
  title: string;
  body: string;
  subitems: SubitemType[];
} 

export interface SubitemType {
  subitem_id?: number;
  note_id: number;
  text: string;
  is_checked: boolean;
}