import { createSignal, type Component, For, Show } from 'solid-js';

import { useNotes } from '../../../context/NotesContext';
import { Note, SubitemType } from '../../../types/notes';
import Subitem from './Subitem';

type NoteCardProps = {
  note: Note;
  sortable?: any; // TODO: export type Sortable from "@thisbeyond/solid-dnd";
};

const NoteCard: Component<NoteCardProps> = ({ sortable, note }) => {
  const { deleteNote, updateNoteTitle, updateNoteBody, addNewSubitem, updateSubitemCheckbox, updateSubitemText, deleteSubitem } = useNotes();
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const [currentTitle, setCurrentTitle] = createSignal(note.title);
  const [isEditingBody, setIsEditingBody] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(note.body);
  const [newSubitem, setNewSubitem] = createSignal({ text: "", isChecked: false, noteId: note.noteId });
  
  const getSubitemsWithEmpty = () => [
    ...note.subitems,
    newSubitem()
  ];
  
  const saveTitle = async () => {
    await updateNoteTitle(note.noteId, currentTitle());
    setIsEditingTitle(false);
  };
  
  const saveBody = async () => {
    await updateNoteBody(note.noteId, currentBody());
    setIsEditingBody(false);
  };
  
  const handleAddNewSubitem = async (newText: string) => {
    try {
      await addNewSubitem(note.noteId, newText);
    } catch (error) {
      // Revert to a blank new subitem state if API call fails
      setNewSubitem({ text: "", isChecked: false, noteId: note.noteId });
    }
  }

  const handleSubitemCheckboxUpdate = async (subitem: SubitemType) => {
    
    if (subitem.subitemId) {
      await updateSubitemCheckbox(subitem.subitemId, subitem.isChecked);
    }
  };

  const handleSubitemTextUpdate = async (subitem: SubitemType, newText: string) => {
    subitem.text = newText;
    
    if (subitem.subitemId) {
      await updateSubitemText(subitem.subitemId, newText);
    }
  };

  const handleSubitemDelete = async (subitem: SubitemType) => {
    if (subitem.subitemId) {
      await deleteSubitem(subitem.subitemId);
    }
  };

  return (
    <div class="bg-white p-2 mx-auto sm:mx-0 mb-0 m-4 text-center rounded-md shadow-md flex flex-col min-h-[150px] w-[95%] sm:w-full">
      <div class="flex items-center justify-between w-full mb-1">
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => deleteNote(note.noteId)}>
          delete
        </span>
        {isEditingTitle() ? (
          <div class="flex-grow flex items-center">
            <input
              id={`note-${note.noteId}-title`}
              type="text"
              class="w-full border border-gray-300 rounded-md p-1 text-center font-bold h-[1.5em]"
              value={currentTitle()}
              onInput={(e) => setCurrentTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveTitle();
                } else if (e.key === 'Escape') {
                  setCurrentTitle(note.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={saveTitle}
              autofocus
            />
          </div>
        ) : (
          <h2 class="flex-grow cursor-pointer hover:bg-gray-100 rounded px-1" onClick={() => setIsEditingTitle(true)}>
            <b>{note.title}</b>
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
        {note.noteType === 'freetext' ? (
          <>
            {isEditingBody() ? (
              <>{/* Editing note display*/}
              <textarea 
                id={`note-${note.noteId}-body`}
                class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
                value={currentBody()}
                onInput={(e) => setCurrentBody(e.currentTarget.value)}
                rows={currentBody().split('\n').length}
              />
              
              <div class="flex items-center justify-between w-full mt-2">
                <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                  onClick={() => {
                    setCurrentBody(note.body);
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
                <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{note.body}</p>
                
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
                  onNewSubitemTextAdded={handleAddNewSubitem}
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