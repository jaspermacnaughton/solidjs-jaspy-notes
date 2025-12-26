import { createSignal, For, Show } from "solid-js";

import { useNotes } from "../../../context/NotesContext";
import { SubitemType } from '../../../types/notes';
import Subitem from "./Subitem";

export default function NewNote() {
  const { addNewNote } = useNotes();
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = createSignal(true);
  const [isProcessingNoteCreation, setIsProcessingNoteCreation] = createSignal(false);
  const [title, setTitle] = createSignal("");
  const [noteType, setNoteType] = createSignal<'freetext' | 'subitems'>('freetext');
  const [body, setBody] = createSignal("");
  const [subitemTempId, setSubitemTempId] = createSignal(-1);
  const [subitems, setSubitems] = createSignal<SubitemType[]>([]);
  const [newSubitem, setNewSubitem] = createSignal<SubitemType>({ text: "", isChecked: false, noteId: -1 });
  
  const onAddNewNote = async () => {
    console.log('Adding a new note with subitem text:', newSubitem().text);
    
    if (newSubitem().text.trim() !== "") {
      setSubitems(items => [...items, { subitemId: subitemTempId(), text: newSubitem().text.trim(), isChecked: newSubitem().isChecked, noteId: -1 }]);
      setSubitemTempId(subitemTempId() - 1);
      setNewSubitem({ text: "", isChecked: newSubitem().isChecked, noteId: -1 });
    }
    
    await addNewNote({
      title: title(),
      noteType: noteType(),
      body: noteType() === 'freetext' ? body() : '',
      subitems: noteType() === 'subitems' ? subitems() : [],
    });
    
    setTitle("");
    // keep new note type same as what user previously chose
    setBody("");
    setSubitems([]);
    
    // reset our active processing flag
    setIsProcessingNoteCreation(false);
  }
  
  const onNewSubitemTextChange = (newText: string) => {
    // keep ref to this up to date
    setNewSubitem({ ...newSubitem(), text: newText });
  };

  const onNewSubitemTextAdded = (_: SubitemType, newText: string) => {
    // Don't add subitem to list if we're in the process of creating the note - let that func handle
    if (isProcessingNoteCreation()) {
      return;
    }
    
    if (newText.trim() !== "") {
      setSubitems(items => [...items, { subitemId: subitemTempId(), text: newText, isChecked: newSubitem().isChecked, noteId: -1 }]);
      setSubitemTempId(subitemTempId() - 1);
      setNewSubitem({ text: "", isChecked: newSubitem().isChecked, noteId: -1 });
    }
  };

  const onExistingSubitemTextUpdated = (subitem: SubitemType, newText: string) => {
    setSubitems(items => 
      items.map(item => 
        item.subitemId === subitem.subitemId ? { ...item, text: newText } : item
      )
    );
  };
  
  const onNewSubitemCheckboxToggled = (_: SubitemType) => {
    setNewSubitem({ ...newSubitem(), isChecked: !newSubitem().isChecked });
  };
  
  const onExistingSubitemCheckboxToggled = (subitem: SubitemType) => {
    setSubitems(items => 
      items.map(item => 
        item.subitemId === subitem.subitemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const onSubitemDelete = (subitem: SubitemType) => {
    setSubitems(items => items.filter(item => item !== subitem));
  };

  return (
    <Show
      when={isNewNoteModalOpen()}
      fallback={<button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={() => setIsNewNoteModalOpen(true)}>+</button>}
    >
      
      <div class="bg-white rounded-md shadow-md sm:float-right min-w-80 w-[95%] sm:w-1/4 flex flex-col mb-6 sm:mb-4 mx-auto sm:mx-0">
        <div class="flex items-center justify-between w-full">
          <div class="w-6"></div>
          <h3 class="flex-grow text-center m-2 text-xl"><b>New Note</b></h3>
          <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm mr-2"
            onClick={() => setIsNewNoteModalOpen(false)}>
              cancel
          </span>
        </div>
        
        <hr />
          
        <input
          id="newNoteTitle"
          class="bg-gray-50 border border-gray-300 rounded-md m-4 p-1"
          placeholder="title"
          required value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)} 
        />
        
        <div class="flex items-center justify-center m-4 mt-2">
          <div class="flex w-full rounded-lg border border-gray-300 overflow-hidden">
            <button
              class={`flex-1 px-4 py-2 text-sm transition-colors ${
                noteType() === 'freetext'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setNoteType('freetext')}
            >
              Free Text
            </button>
            <button
              class={`flex-1 px-4 py-2 text-sm transition-colors border-l ${
                noteType() === 'subitems'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setNoteType('subitems')}
            >
              Subitems
            </button>
          </div>
        </div>

        {noteType() === 'freetext' ? (
          <textarea
            id="newNoteBody"
            class="bg-gray-50 border border-gray-300 rounded-md m-4 mt-2 p-1 h-32" 
            placeholder="body"  
            required 
            value={body()}
            onInput={(e) => setBody(e.currentTarget.value)} 
          />
        ) : (
          <div class="flex flex-col gap-2 m-4 mt-2">
            <For each={subitems()}>
              {(subitem) => (
                <Subitem
                  subitem={subitem}
                  isBlankNewSubitem={false}
                  isInDragHover={false}
                  onFocusOut={onExistingSubitemTextUpdated}
                  onCheckboxToggled={onExistingSubitemCheckboxToggled}
                  onDelete={onSubitemDelete}
                />
              )}
            </For>
            
            {/* Blank placeholder new subitem */}
            <Subitem
              subitem={newSubitem()}
              isBlankNewSubitem={true}
              isInDragHover={false}
              onTextChange={onNewSubitemTextChange}
              onFocusOut={onNewSubitemTextAdded}
              onCheckboxToggled={onNewSubitemCheckboxToggled}
              onDelete={() => {}}
            />
          </div>
        )}
          
          <div>
            <button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" 
              onMouseDown={() => {
                // Set flag before focusout fires to prevent subitem from being added to list
                setIsProcessingNoteCreation(true);
              }}
              onClick={onAddNewNote}
              onMouseUp={() => {
                // Reset flag after mouseup to allow subitem to be added to list
                setIsProcessingNoteCreation(false);
              }}
            >+</button>
          </div>
      </div>
    </Show>
  );
} 