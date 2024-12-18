import { createResource, createSignal, For, Show } from "solid-js";
import NoteCard from "./NoteCard";
import { useAuth } from "../context/AuthContext";
import { Note } from '../types/notes';
import { handleApiResponse } from "../utils/api";

export default function Notes() {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  const [isAddingNewNote, setIsAddingNewNote] = createSignal(true);
  const [newTitle, setNewTitle] = createSignal("Example Title");
  const [newBody, setNewBody] = createSignal("Example Body");
  
  const fetchNotes = async () => {
    const response = await fetch("api/notes", {
      headers: {
        'Authorization': `Bearer ${auth.token()}`
      }
    });
    return handleApiResponse(response, auth.logout);
  };
  
  const [notes, { mutate }] = createResource(() => 
    fetchNotes().catch(err => {
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
          body: newBody()
        }),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        return [...existingNotes, { note_id: data.note_id, title: newTitle(), body: newBody() }]
      });
      
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

  return (
    <>
      <header class="my-4 p-2 flex items-center justify-between">
        <h1 class="text-2xl">Jaspy Notes</h1>
        <div class="flex items-center gap-4">
          <span>Welcome, {auth.username()}</span>
          <button 
            onClick={() => auth.logout()}
            class="btn"
          >
            Logout
          </button>
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
                <NoteCard note_id={item.note_id} title={item.title} body={item.body} onDelete={deleteNote}/>
              )}
            </For>
          </div>
        </Show>
      </main>
      
      <footer class="text-right basis-auto mt-4 justify-center">
        <Show
          when={isAddingNewNote()}
          fallback={<button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={() => setIsAddingNewNote(true)}>+</button>}
        >
          
          <div class="bg-white rounded-md shadow-md float-right min-w-80 w-1/4 flex flex-col">
            
            <div class="flex items-center justify-between w-full">
              <div class="w-6"></div>
              <h3 class="flex-grow text-center m-2 text-xl"><b>New Note</b></h3>
              <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm mr-2"
                onClick={() => setIsAddingNewNote(false)}>
                  cancel
              </span>
            </div>
            
            <hr />
              
            <label class="text-left m-4 mb-1"><b>Title:</b></label>
            <input
              class="bg-gray-50 border border-gray-300 rounded-md m-4 mt-0 p-1"
              placeholder="title"
              required value={newTitle()}
              onInput={(e) => setNewTitle(e.currentTarget.value)} 
            />

            <label class="text-left m-4 mb-1"><b>Body:</b></label>
            <textarea
              class="bg-gray-50 border border-gray-300 rounded-md m-4 mt-0 p-1 h-32" 
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