import { createSignal, For, Show } from "solid-js";

import { useAuth } from "../context/AuthContext";
import { Note, SubitemType } from '../types/notes';
import Subitem from "./Subitem";
import { handleApiResponse } from "../utils/api";

interface NewNoteProps {
  onNoteAddedToDatabase: (newNote: Note) => void;
  notesLength: number;
}

export default function NewNote(props: NewNoteProps) {
  const auth = useAuth();
  const [isAddingNewNote, setIsAddingNewNote] = createSignal(true);
  const [newTitle, setNewTitle] = createSignal("");
  const [newNoteType, setNewNoteType] = createSignal<'freetext' | 'subitems'>('freetext');
  const [newBody, setNewBody] = createSignal("");
  const [newSubitems, setNewSubitems] = createSignal<SubitemType[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  
  const getNewNoteSubitemsWithEmpty = () => [
    ...newSubitems(),
    { text: "", is_checked: false, note_id: -1 }
  ];

  const handleNewNoteAddSubitem = (newText: string) => {
    if (newText.trim()) {
      setNewSubitems(items => [...items, { text: newText, is_checked: false, note_id: -1 }]);
    }
  };
  
  const handleNewNoteSubitemCheckboxUpdate = (subitem: SubitemType) => {
    setNewSubitems(items => 
      items.map(item => 
        item === subitem ? { ...item, is_checked: !item.is_checked } : item
      )
    );
  };

  const handleNewNoteSubitemTextUpdate = (subitem: SubitemType, newText: string) => {
    setNewSubitems(items => 
      items.map(item => 
        item === subitem ? { ...item, text: newText } : item
      )
    );
  };

  const handleNewNoteSubitemDelete = (subitem: SubitemType) => {
    setNewSubitems(items => items.filter(item => item !== subitem));
  };

  const postNewNote = async () => {
    setError(null);
    
    try {
      let newNoteDisplayOrder = props.notesLength;
      
      const response = await fetch('api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          title: newTitle(),
          note_type: newNoteType(),
          body: newNoteType() === 'freetext' ? newBody() : '',
          subitems: newNoteType() === 'subitems' ? newSubitems() : [],
          display_order: newNoteDisplayOrder
        }),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      props.onNoteAddedToDatabase(
        {
          note_id: data.note_id, 
          title: newTitle(), 
          note_type: newNoteType(),
          body: newNoteType() === 'freetext' ? newBody() : '',
          subitems: newNoteType() === 'subitems' ? newSubitems() : [],
          display_order: newNoteDisplayOrder
        }
      );
      
      setNewTitle("");
      // keep new note type same as what user previously chose
      setNewBody("");
      setNewSubitems([]);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Show
      when={isAddingNewNote()}
      fallback={<button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={() => setIsAddingNewNote(true)}>+</button>}
    >
      
      <div class="bg-white rounded-md shadow-md sm:float-right min-w-80 w-[95%] sm:w-1/4 flex flex-col mb-6 sm:mb-4 mx-auto sm:mx-0">
        <div class="flex items-center justify-between w-full">
          <div class="w-6"></div>
          <h3 class="flex-grow text-center m-2 text-xl"><b>New Note</b></h3>
          <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm mr-2"
            onClick={() => setIsAddingNewNote(false)}>
              cancel
          </span>
        </div>
        
        <hr />
          
        <input
          id="newNoteTitle"
          class="bg-gray-50 border border-gray-300 rounded-md m-4 p-1"
          placeholder="title"
          required value={newTitle()}
          onInput={(e) => setNewTitle(e.currentTarget.value)} 
        />
        
        <div class="flex items-center justify-center m-4 mt-2">
          <div class="flex w-full rounded-lg border border-gray-300 overflow-hidden">
            <button
              class={`flex-1 px-4 py-2 text-sm transition-colors ${
                newNoteType() === 'freetext'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setNewNoteType('freetext')}
            >
              Free Text
            </button>
            <button
              class={`flex-1 px-4 py-2 text-sm transition-colors border-l ${
                newNoteType() === 'subitems'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setNewNoteType('subitems')}
            >
              Subitems
            </button>
          </div>
        </div>

        {newNoteType() === 'freetext' ? (
          <textarea
            id="newNoteBody"
            class="bg-gray-50 border border-gray-300 rounded-md m-4 mt-2 p-1 h-32" 
            placeholder="body"  
            required 
            value={newBody()}
            onInput={(e) => setNewBody(e.currentTarget.value)} 
          />
        ) : (
          <div class="flex flex-col gap-2 m-4 mt-2">
            <For each={getNewNoteSubitemsWithEmpty()}>
              {(subitem, index) => (
                <Subitem
                  subitem={subitem}
                  isLast={index() === getNewNoteSubitemsWithEmpty().length - 1}
                  onNewSubitemTextAdded={handleNewNoteAddSubitem}
                  onExistingSubitemTextUpdated={handleNewNoteSubitemTextUpdate}
                  onCheckboxToggled={handleNewNoteSubitemCheckboxUpdate}
                  onDelete={handleNewNoteSubitemDelete}
                />
              )}
            </For>
          </div>
        )}
          
          <div>
            <button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={postNewNote}>+</button>
          </div>
      </div>
    </Show>
  );
} 