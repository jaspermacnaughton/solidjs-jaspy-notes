import { Component, Show } from "solid-js";

import { SubitemType } from "../../../types/notes";

type SubitemProps = {
  subitem: SubitemType;
  isBlankNewSubitem: boolean;
  isInDragHover: boolean;
  onTextUpdated: (subitem: SubitemType, newText: string) => void;
  onCheckboxToggled: (subitem: SubitemType) => void;
  onDelete: (subitem: SubitemType) => void;
}

const Subitem: Component<SubitemProps> = (props) => {
  const idSuffix = props.isInDragHover ? '-drag-hover' : '';
  const checkboxId = props.isBlankNewSubitem ? `note-${props.subitem.noteId}-blank-checkbox${idSuffix}` : `subitem-${props.subitem.subitemId}-checkbox${idSuffix}`;
  const textId = props.isBlankNewSubitem ? `note-${props.subitem.noteId}-blank-text${idSuffix}` : `subitem-${props.subitem.subitemId}-text${idSuffix}`;
  
  return (
    <div class="flex items-center gap-2 p-1 border border-gray-200 rounded-md">
      <input 
        id={checkboxId}
        type="checkbox" 
        class="w-4 h-4 m-2 mr-1 accent-emerald-600 cursor-pointer" 
        checked={props.subitem.isChecked}
        onChange={() => props.onCheckboxToggled(props.subitem)}
      />
      
      <textarea 
        id={textId}
        class={`flex-grow whitespace-pre-wrap text-left bg-gray-50 border border-gray-300 rounded-md p-1 resize-none ${
          props.subitem.isChecked ? 'line-through text-gray-500' : ''
        }`}
        value={props.subitem.text}
        rows={props.subitem.text.split('\n').length}
        onfocusout={(e) => props.onTextUpdated(props.subitem, e.currentTarget.value)}
        placeholder={props.isBlankNewSubitem ? "Add new..." : ""}
      />
      
      <Show when={!props.isBlankNewSubitem}>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm mr-1 align-middle"
          onClick={() => props.onDelete(props.subitem)}
        >
          delete
        </span>
      </Show>
    </div>
  );
};

export default Subitem;