import { Component } from "solid-js";
import { SubitemType } from "../types/notes";

type SubitemProps = {
  subitem: SubitemType;
  onToggleCheckbox: (subitem: SubitemType) => void;
  onUpdateText: (subitem: SubitemType, newText: string) => void;
  onDelete: (subitem: SubitemType) => void;
}

const Subitem: Component<SubitemProps> = (props) => {
  return (
    <div class="flex items-center gap-2 p-1 border border-gray-200 rounded-md">
      <input 
        id={`subitem-${props.subitem.subitem_id}-checkbox`}
        type="checkbox" 
        class="w-4 h-4 m-2 mr-1 accent-emerald-600 cursor-pointer" 
        checked={props.subitem.is_checked}
        onChange={() => props.onToggleCheckbox(props.subitem)}
      />
      <textarea 
        id={`subitem-${props.subitem.subitem_id}-text`}
        class={`flex-grow whitespace-pre-wrap text-left bg-gray-50 border border-gray-300 rounded-md p-1 resize-none ${
          props.subitem.is_checked ? 'line-through text-gray-500' : ''
        }`}
        value={props.subitem.text}
        rows={props.subitem.text.split('\n').length}
        onfocusout={(e) => props.onUpdateText(props.subitem, e.currentTarget.value)}
      />
      <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
        onClick={() => props.onDelete(props.subitem)}
      >
        delete
      </span>
    </div>
  );
};

export default Subitem;