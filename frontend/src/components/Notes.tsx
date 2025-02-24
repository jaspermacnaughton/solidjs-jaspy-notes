import { createResource, createSignal, For, Show } from "solid-js";
import NoteCard from "./NoteCard";
import { useAuth } from "../context/AuthContext";
import { Note } from '../types/notes';
import { handleApiResponse } from "../utils/api";

export default function Notes() {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  const [isAddingNewNote, setIsAddingNewNote] = createSignal(true);
  const [newTitle, setNewTitle] = createSignal("");
  const [newNoteType, setNewNoteType] = createSignal<'freetext' | 'subitems'>('freetext');
  const [newBody, setNewBody] = createSignal("");
  
  const fetchNotes = async () => {
    const response = await fetch("api/notes", {
      headers: {
        'Authorization': `Bearer ${auth.token()}`
      }
    });
    const data = await handleApiResponse(response, auth.logout);
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch notes');
    }
    return data.notes;
  };
  
  const [notes, { mutate }] = createResource(
    () => auth.token(),
    () => fetchNotes().catch(err => {
      setError(err.message);
      throw err;
    })
  );

  const postNewNote = async () => {
    setError(null);
    
    try {
      const response = await fetch('api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          title: newTitle(),
          note_type: newNoteType(),
          body: newBody(),
        }),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        return [...existingNotes, { 
          note_id: data.note_id, 
          title: newTitle(), 
          note_type: newNoteType(),
          body: newBody(),
          subitems: []
        }]
      });
      
      setNewTitle("");
      // keep new note type same as what user previously chose
      setNewBody("");
      
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const deleteNote = async (idTodelete: number) => {
    setError(null);
    
    try {
      const response = await fetch('api/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          note_id: idTodelete
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        const updatedNotes = [...existingNotes];
        const indexToDelete = existingNotes.findIndex((note: Note) => note.note_id == idTodelete);
        if (indexToDelete === -1) {
          throw new Error(`Failed to delete note ${idTodelete}`);
        }
        updatedNotes.splice(indexToDelete, 1);
        return updatedNotes;
      });
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateNote = async (noteId: number, newBody: string) => {
    setError(null);
    
    try {
      const response = await fetch('api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          note_id: noteId,
          body: newBody
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => 
          note.note_id === noteId 
            ? { 
                ...note, 
                body: newBody,
              }
            : note
        );
      });
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const addNewSubitem = async (noteId: number, newText: string) => { 
    setError(null);
    
    try {
      const response = await fetch(`api/notes/subitems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          note_id: noteId,
          text: newText
        }),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => 
          note.note_id === noteId
            ? {
                ...note,
                subitems: [...note.subitems, { subitem_id: data.subitem_id, text: newText, is_checked: false, note_id: noteId }]
              }
            : note
        );
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSubitemCheckbox = async (subitemId: number, isChecked: boolean) => {
    setError(null);
    
    try {
      const response = await fetch(`api/notes/subitems/checkbox/${subitemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          is_checked: isChecked
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.map(subitem => 
            subitem.subitem_id === subitemId 
              ? { ...subitem, is_checked: isChecked }
              : subitem
          )
        }));
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSubitemText = async (subitemId: number, newText: string) => {
    setError(null);
    
    try {
      const response = await fetch(`api/notes/subitems/text/${subitemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          text: newText
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.map(subitem => 
            subitem.subitem_id === subitemId 
              ? { ...subitem, text: newText }
              : subitem
          )
        }));
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteSubitem = async (subitemId: number) => {
    setError(null);
    
    try {
      const response = await fetch(`api/notes/subitems/${subitemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token()}`
        }
      });
      
      await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.filter(subitem => subitem.subitem_id !== subitemId)
        }));
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <header class="my-4 p-2">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div class="invisible hidden sm:flex items-center gap-2">
            <span class="text-sm sm:text-base">Welcome, {auth.username()}</span>
            <div class="btn text-sm sm:text-base">Logout</div>
          </div>
          
          <h1 class="text-2xl sm:text-3xl">Jaspy Notes</h1>
          
          <div class="flex items-center gap-2">
            <span class="text-sm sm:text-base">Welcome, {auth.username()}</span>
            <button onClick={() => auth.logout()} class="btn text-sm sm:text-base">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {error() && (
        <div class="text-red-500 bg-red-200 px-4 py-2 mb-2 rounded">
          Error: {error()}
        </div>
      )}
      
      <main class="flex-1">
        <Show
          when={!notes.loading && !notes.error}
          fallback={<div>Loading...</div>}
        >
          <div class="grid sticky-grid">
            <For each={notes()}>
              {(item) => (
                <NoteCard 
                  note_id={item.note_id} 
                  title={item.title} 
                  body={item.body} 
                  subitems={item.subitems} 
                  onDelete={deleteNote} 
                  onSaveFreeTextEdits={updateNote}
                  onAddSubitem={addNewSubitem}
                  onUpdateSubitemCheckbox={updateSubitemCheckbox}
                  onUpdateSubitemText={updateSubitemText}
                  onDeleteSubitem={deleteSubitem}
                />
              )}
            </For>
          </div>
        </Show>
      </main>
      
      <footer class="text-right basis-auto mt-16 justify-center">
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

            <textarea
              id="newNoteBody"
              class="bg-gray-50 border border-gray-300 rounded-md m-4 mt-2 p-1 h-32" 
              placeholder="body"  
              required value={newBody()}
              onInput={(e) => setNewBody(e.currentTarget.value)} 
            />
              
              <div>
                <button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={postNewNote}>+</button>
              </div>
          </div>
        </Show>
      </footer>
    </>
  );
}