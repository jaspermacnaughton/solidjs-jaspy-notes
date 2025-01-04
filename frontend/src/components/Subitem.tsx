import { Component, Show } from "solid-js";
import { SubitemType } from "../types/notes";

type SubitemProps = {
  subitem: SubitemType;
  isLast: boolean;
  onCheckboxToggled: (subitem: SubitemType) => void;
  onTextUpdated: (subitem: SubitemType, newText: string) => void;
  onLastSubitemTextAdded: (subitem: SubitemType) => void;
  onDelete?: (subitem: SubitemType) => void;
}

const Subitem: Component<SubitemProps> = (props) => {
  return (
    <div class="flex items-center gap-2 p-1 border border-gray-200 rounded-md">
      <input 
        id={`subitem-${props.subitem.subitem_id}-checkbox`}
        type="checkbox" 
        class="w-4 h-4 m-2 mr-1 accent-emerald-600 cursor-pointer" 
        checked={props.subitem.is_checked}
        onChange={() => props.onCheckboxToggled(props.subitem)}
      />
      
      <textarea 
        id={`subitem-${props.subitem.subitem_id}-text`}
        class={`flex-grow whitespace-pre-wrap text-left bg-gray-50 border border-gray-300 rounded-md p-1 resize-none ${
          props.subitem.is_checked ? 'line-through text-gray-500' : ''
        }`}
        value={props.subitem.text}
        rows={props.subitem.text.split('\n').length}
        onInput={(e) => (props.isLast && e.currentTarget.value.length === 1) ? props.onLastSubitemTextAdded(props.subitem) : null}
        onfocusout={(e) => props.subitem.text !== e.currentTarget.value ? props.onTextUpdated(props.subitem, e.currentTarget.value) : null}
        placeholder={props.isLast ? "Add new item..." : ""}
      />
      
      <Show when={!props.isLast}>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => props.onDelete && props.onDelete(props.subitem)}
        >
          delete
        </span>
      </Show>
    </div>
  );
};

export default Subitem;