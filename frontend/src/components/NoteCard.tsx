import { createSignal, type Component, For } from 'solid-js';
import { SubitemType } from '../types/notes';
import Subitem from './Subitem';

type NoteCardProps = {
  note_id: number;
  title: string;
  note_type: 'freetext' | 'subitems';
  body: string;
  subitems: SubitemType[];
  onDelete: (note_id: number) => void;
  onSaveFreeTextEdits: (note_id: number, newBody: string) => Promise<void>;
  onAddSubitem: (note_id: number, newText: string) => Promise<void>;
  onUpdateSubitemCheckbox: (subitemId: number, isChecked: boolean) => Promise<void>;
  onUpdateSubitemText: (subitemId: number, newText: string) => Promise<void>;
  onDeleteSubitem: (subitemId: number) => Promise<void>;
};

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.body);
  
  const getSubitemsWithEmpty = () => [
    ...props.subitems,
    { text: "", is_checked: false, note_id: props.note_id }
  ];
  
  const saveBody = async () => {
    await props.onSaveFreeTextEdits(props.note_id, currentBody());
    setIsEditing(false);
  };
  
  const addNewSubitem = async (newText: string) => {
    await props.onAddSubitem(props.note_id, newText);
  }

  const handleSubitemCheckboxUpdate = async (subitem: SubitemType) => {
    subitem.is_checked = !subitem.is_checked;
    
    try {
      if (subitem.subitem_id) {
        await props.onUpdateSubitemCheckbox(subitem.subitem_id, subitem.is_checked);
      }
    } catch (error) {
      // Revert the checkbox if the API call fails
      subitem.is_checked = !subitem.is_checked;
    }
  };

  const handleSubitemTextUpdate = async (subitem: SubitemType, newText: string) => {
    const oldText = subitem.text;
    subitem.text = newText;
    
    try {
      if (subitem.subitem_id) {
        await props.onUpdateSubitemText(subitem.subitem_id, newText);
      }
    } catch (error) {
      // Revert the text if the API call fails
      subitem.text = oldText;
    }
  };

  const handleSubitemDelete = async (subitem: SubitemType) => {
    if (subitem.subitem_id) {
      await props.onDeleteSubitem(subitem.subitem_id);
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
      
      <div class="flex flex-col flex-grow">
        {props.note_type === 'freetext' ? (
          <>
            {isEditing() ? (
              <>{/* Editing note display*/}
              <textarea 
                id={`note-${props.note_id}-body`}
                class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
                value={currentBody()}
                onInput={(e) => setCurrentBody(e.currentTarget.value)}
                rows={currentBody().split('\n').length}
              />
              
              <div class="flex items-center justify-between w-full mt-2">
                <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                  onClick={() => {
                    setCurrentBody(props.body);
                    setIsEditing(false);
                  }}>
                  cancel
                </button>
                <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                  onClick={saveBody}>
                  save
                </button>
              </div>
            </>
            ) : (
              <>{/* Viewing note display*/}
                <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{props.body}</p>
                
                <div class="flex items-center justify-end w-full mt-2">
                  <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                    onClick={() => setIsEditing(true)}>
                    edit
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div class="flex flex-col gap-2 mt-2">
            <For each={getSubitemsWithEmpty()}>
              {(subitem, index) => (
                <Subitem
                  subitem={subitem}
                  isLast={index() === getSubitemsWithEmpty().length - 1}
                  onNewSubitemTextAdded={addNewSubitem}
                  onExistingSubitemTextUpdated={handleSubitemTextUpdate}
                  onCheckboxToggled={handleSubitemCheckboxUpdate}
                  onDelete={handleSubitemDelete}
                />
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCard;