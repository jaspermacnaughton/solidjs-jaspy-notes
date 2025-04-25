export interface Note {
  noteId: number;
  title: string;
  noteType: 'freetext' | 'subitems';
  body: string;
  subitems: SubitemType[];
  displayOrder: number;
} 

export interface SubitemType {
  subitemId?: number;
  noteId: number;
  text: string;
  isChecked: boolean;
}