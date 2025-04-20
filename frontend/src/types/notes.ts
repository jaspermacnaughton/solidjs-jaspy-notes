export interface Note {
  note_id: number;
  title: string;
  note_type: 'freetext' | 'subitems';
  body: string;
  subitems: SubitemType[];
  display_order: number;
} 

export interface SubitemType {
  subitem_id?: number;
  note_id: number;
  text: string;
  is_checked: boolean;
}