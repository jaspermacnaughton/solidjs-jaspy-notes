import { createSignal, type Component, For } from 'solid-js';

import { Note, SubitemType } from '../types/notes';
import Subitem from './Subitem';

type NoteCardProps = {
  note: Note;
  onDelete: (noteId: number) => void;
  onSaveFreeTextEdits: (noteId: number, newBody: string) => Promise<void>;
  onAddSubitem: (noteId: number, newText: string) => Promise<void>;
  onUpdateSubitemCheckbox: (subitemId: number, isChecked: boolean) => Promise<void>;
  onUpdateSubitemText: (subitemId: number, newText: string) => Promise<void>;
  onDeleteSubitem: (subitemId: number) => Promise<void>;
};

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.note.body);
  
  const getSubitemsWithEmpty = () => [
    ...props.note.subitems,
    { text: "", isChecked: false, noteId: props.note.noteId }
  ];
  
  const saveBody = async () => {
    await props.onSaveFreeTextEdits(props.note.noteId, currentBody());
    setIsEditing(false);
  };
  
  const addNewSubitem = async (newText: string) => {
    await props.onAddSubitem(props.note.noteId, newText);
  }

  const handleSubitemCheckboxUpdate = async (subitem: SubitemType) => {
    subitem.isChecked = !subitem.isChecked;
    
    try {
      if (subitem.subitemId) {
        await props.onUpdateSubitemCheckbox(subitem.subitemId, subitem.isChecked);
      }
    } catch (error) {
      // Revert the checkbox if the API call fails
      subitem.isChecked = !subitem.isChecked;
    }
  };

  const handleSubitemTextUpdate = async (subitem: SubitemType, newText: string) => {
    const oldText = subitem.text;
    subitem.text = newText;
    
    try {
      if (subitem.subitemId) {
        await props.onUpdateSubitemText(subitem.subitemId, newText);
      }
    } catch (error) {
      // Revert the text if the API call fails
      subitem.text = oldText;
    }
  };

  const handleSubitemDelete = async (subitem: SubitemType) => {
    if (subitem.subitemId) {
      await props.onDeleteSubitem(subitem.subitemId);
    }
  };

  return (
    <div class="bg-white p-2 mx-auto sm:mx-0 mb-0 m-4 text-center rounded-md shadow-md flex flex-col min-h-[150px] w-[95%] sm:w-full">
      <div class="flex items-center justify-between w-full mb-1">
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => props.onDelete(props.note.noteId)}>
          delete
        </span>
        <h2 class="flex-grow"><b>{props.note.title}</b></h2>
        <span class="w-6 material-symbols-outlined cursor-grab hover:bg-neutral-100 rounded-sm align-middle">
          drag_indicator
        </span>
      </div>
      
      <hr class="mb-2" />
      
      <div class="flex flex-col flex-grow">
        {props.note.noteType === 'freetext' ? (
          <>
            {isEditing() ? (
              <>{/* Editing note display*/}
              <textarea 
                id={`note-${props.note.noteId}-body`}
                class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
                value={currentBody()}
                onInput={(e) => setCurrentBody(e.currentTarget.value)}
                rows={currentBody().split('\n').length}
              />
              
              <div class="flex items-center justify-between w-full mt-2">
                <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                  onClick={() => {
                    setCurrentBody(props.note.body);
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
                <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{props.note.body}</p>
                
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