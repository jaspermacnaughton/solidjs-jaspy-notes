import { createSignal, type Component, For, Show } from 'solid-js';

import { Note, SubitemType } from '../types/notes';
import Subitem from './Subitem';

type NoteCardProps = {
  note: Note;
  sortable?: any; // TODO: export type Sortable from "@thisbeyond/solid-dnd";
  onDelete: (noteId: number) => void;
  onSaveTitleEdits: (noteId: number, newTitle: string) => Promise<void>;
  onSaveFreeTextBodyEdits: (noteId: number, newBody: string) => Promise<void>;
  onAddSubitem: (noteId: number, newText: string) => Promise<void>;
  onUpdateSubitemCheckbox: (subitemId: number, isChecked: boolean) => Promise<void>;
  onUpdateSubitemText: (subitemId: number, newText: string) => Promise<void>;
  onDeleteSubitem: (subitemId: number) => Promise<void>;
};

const NoteCard: Component<NoteCardProps> = ({ sortable, ...props }) => {
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const [currentTitle, setCurrentTitle] = createSignal(props.note.title);
  const [isEditingBody, setIsEditingBody] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.note.body);
  
  const getSubitemsWithEmpty = () => [
    ...props.note.subitems,
    { text: "", isChecked: false, noteId: props.note.noteId }
  ];
  
  const saveTitle = async () => {
    await props.onSaveTitleEdits(props.note.noteId, currentTitle());
    setIsEditingTitle(false);
  };
  
  const saveBody = async () => {
    await props.onSaveFreeTextBodyEdits(props.note.noteId, currentBody());
    setIsEditingBody(false);
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
        {isEditingTitle() ? (
          <div class="flex-grow flex items-center">
            <input
              id={`note-${props.note.noteId}-title`}
              type="text"
              class="w-full border border-gray-300 rounded-md p-1 text-center font-bold h-[1.5em]"
              value={currentTitle()}
              onInput={(e) => setCurrentTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveTitle();
                } else if (e.key === 'Escape') {
                  setCurrentTitle(props.note.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={saveTitle}
              autofocus
            />
          </div>
        ) : (
          <h2 class="flex-grow cursor-pointer hover:bg-gray-100 rounded px-1" onClick={() => setIsEditingTitle(true)}>
            <b>{props.note.title}</b>
          </h2>
        )}
        <Show when={sortable} fallback={
          <span class="w-6 material-symbols-outlined cursor-grab hover:bg-neutral-100 rounded-sm align-middle">
            drag_indicator
          </span>
        }>
          <span class="w-6 material-symbols-outlined cursor-grab hover:bg-neutral-100 rounded-sm align-middle" {...sortable.dragActivators}>
            drag_indicator
          </span>
        </Show>
      </div>
      
      <hr class="mb-2" />
      
      <div class="flex flex-col flex-grow">
        {props.note.noteType === 'freetext' ? (
          <>
            {isEditingBody() ? (
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
                    setIsEditingBody(false);
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
                    onClick={() => setIsEditingBody(true)}>
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
                  isInDragHover={sortable !== undefined}
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