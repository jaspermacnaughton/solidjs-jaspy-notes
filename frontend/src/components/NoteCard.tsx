import { createSignal, type Component, For } from 'solid-js';
import { Subitem } from '../types/notes';

type NoteCardProps = {
  note_id: number;
  title: string;
  body: string;
  subitems: Subitem[];
  onDelete: (note_id: number) => void;
  onSaveEdit: (note_id: number, newBody: string, newSubitems: Subitem[]) => void;
  onUpdateSubitemCheckbox: (subitemId: number, isChecked: boolean) => Promise<void>;
}

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.body);
  const [currentSubitems, setCurrentSubitems] = createSignal([...props.subitems]);

  const addSubitem = () => {
    setCurrentSubitems([...currentSubitems(), { text: "", is_checked: false, note_id: props.note_id }]);
  };

  const updateSubitemText = (subitem: Subitem, newText: string) => {
    const updatedSubitems = currentSubitems().map(item => 
      item === subitem ? { ...item, text: newText } : item
    );
    setCurrentSubitems(updatedSubitems);
  };

  const handleSave = () => {
    props.onSaveEdit(props.note_id, currentBody(), currentSubitems());
    setIsEditing(false);
  };

  const toggleSubitem = async (subitem: Subitem) => {
    subitem.is_checked = !subitem.is_checked;
    
    if (!isEditing()) {
      try {
        if (subitem.subitem_id !== undefined) {
          // If the subitem has an ID, update the checkbox on the backend
          await props.onUpdateSubitemCheckbox(subitem.subitem_id, subitem.is_checked);
        }
      } catch (error) {
        // Revert the checkbox if the API call fails
        subitem.is_checked = !subitem.is_checked;
      }
    }
  };

  return (
    <div class="bg-white p-2 mx-auto sm:mx-0 mb-0 m-4 text-center rounded-md shadow-md flex flex-col min-h-[150px] w-[95%] sm:w-full">
      <div class="flex items-center justify-between w-full mb-1">
        <div class="w-6"></div>
        <h2 class="flex-grow"><b>{props.title}</b></h2>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => props.onDelete(props.note_id)}>
          delete
        </span>
      </div>
      
      <hr class="mb-2" />
      
      {isEditing() ? (
        <div class="flex flex-col flex-grow">{/* Editing note display*/}
          <textarea 
            class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
            value={currentBody()}
            onInput={(e) => setCurrentBody(e.currentTarget.value)}
            rows={currentBody().split('\n').length}
          />
          
          <div class="flex flex-col gap-2 mt-2">
            <For each={currentSubitems()}>
              {(subitem) => (
                <div class="flex items-center gap-2 p-1 border border-gray-200 rounded-md">
                  <input 
                    type="checkbox" 
                    class="w-4 h-4 m-2 mr-1 accent-emerald-600 cursor-pointer" 
                    checked={subitem.is_checked}
                    onChange={() => toggleSubitem(subitem)}
                  />
                  <textarea 
                    class={`flex-grow whitespace-pre-wrap text-left bg-gray-50 border border-gray-300 rounded-md p-1 resize-none ${
                      subitem.is_checked ? 'line-through text-gray-500' : ''
                    }`}
                    value={subitem.text}
                    rows={subitem.text.split('\n').length}
                    onfocusout={(e) => updateSubitemText(subitem, e.currentTarget.value)}
                  />
                  <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle">
                    delete
                  </span>
                </div>
              )}
            </For>
          </div>
          
          <div class="flex items-center justify-between w-full mt-2">
            <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => {
                setCurrentBody(props.body);
                setIsEditing(false);
              }}>
              cancel
            </button>
            <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={addSubitem}>
              add_circle
            </button>
            <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={handleSave}>
              save
            </button>
          </div>
        </div>
      ) : (
        <div class="flex flex-col flex-grow">{/* Viewing note display*/}
          <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{props.body}</p>
          
          <div class="flex flex-col gap-2 mt-2">
            <For each={currentSubitems()}>
              {(subitem) => (
                <div class="flex items-center gap-2 p-1 border border-gray-200 rounded-md">
                  <input 
                    type="checkbox" 
                    class="w-4 h-4 m-2 mr-1 accent-emerald-600 cursor-pointer" 
                    checked={subitem.is_checked}
                    onChange={() => toggleSubitem(subitem)}
                  />
                  <p class={`flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1 ${
                    subitem.is_checked ? 'line-through text-gray-500' : ''
                  }`}>
                    {subitem.text}
                  </p>
                </div>
              )}
            </For>
          </div>
          
          <div class="flex items-center justify-end w-full mt-2">
            <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => setIsEditing(true)}>
              edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;