import { createResource, createSignal, For, Show } from "solid-js";
import { createSortable, DragDropProvider, DragDropSensors, DragEvent, SortableProvider, closestCenter } from "@thisbeyond/solid-dnd";

import { useAuth } from "../context/AuthContext";
import { handleApiResponse } from "../utils/api";
import { Note } from '../types/notes';
import NoteCard from "./NoteCard";
import NewNote from "./NewNote";

// Needed so use:sortable doesn't throw linter errors
declare module "solid-js" {
  namespace JSX {
    interface Directives {
      sortable: boolean;
    }
  }
}

export default function Notes() {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  const [activeDraggingNoteId, setActiveDraggingNoteId] = createSignal<number | null>(null);
  const ids = () => notes().map((note: Note) => note.note_id);
  
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

  const addNewNote = (newNote: Note) => {
    mutate((existingNotes = []) => [...existingNotes, newNote]);
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
        // Update display order for remaining notes
        return updatedNotes.map((note, index) => ({
          ...note,
          display_order: index
        }));
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

  const updateNoteOrder = async (noteIds: number[]) => {
    setError(null);
    
    try {
      const response = await fetch('api/notes/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          note_ids: noteIds
        }),
      });
      
      await handleApiResponse(response, auth.logout);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDraggingNoteId(notes().find((note: Note) => note.note_id === Number(event.draggable.id)) || null);
  };

  const handleDragEnd = async ({ draggable, droppable }: DragEvent) => {
    setActiveDraggingNoteId(null);
    
    if (!draggable || !droppable) return;
    
    const currentNotes = notes();
    const fromIndex = currentNotes.findIndex((note: Note) => note.note_id === Number(draggable.id));
    const toIndex = currentNotes.findIndex((note: Note) => note.note_id === Number(droppable.id));
    
    if (fromIndex === toIndex) return;
    
    mutate((existingNotes = []) => {
      const updatedNotes = [...existingNotes];
      const [movedNote] = updatedNotes.splice(fromIndex, 1);
      updatedNotes.splice(toIndex, 0, movedNote);
      
      // Update display_order for all notes
      return updatedNotes.map((note, index) => ({
        ...note,
        display_order: index
      }));
    });
    
    // Get the reordered note IDs
    const reorderedNoteIds = notes()?.map((note: Note) => note.note_id) || [];
    await updateNoteOrder(reorderedNoteIds);
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
      
      <Show when={error()}>
        <div class="text-red-500 bg-red-200 px-4 py-2 mb-2 rounded">
          Error: {error()}
        </div>
      </Show>
      
      <main class="flex-1">
        <Show
          when={!notes.loading && !notes.error}
          fallback={<div>Loading...</div>}
        >
          <DragDropProvider 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd} 
            collisionDetector={closestCenter}
          >
            <DragDropSensors>
              <div class="grid sticky-grid">
                <SortableProvider ids={ids()}>
                  <For each={notes()}>
                    {(item) => {
                      const sortable = createSortable(item.note_id);
                      return (
                        <div
                          use:sortable
                          class="sortable-item"
                          classList={{ "opacity-25": sortable.isActiveDraggable }}
                        >
                          <NoteCard 
                            note_id={item.note_id}
                            title={item.title}
                            note_type={item.note_type}
                            body={item.body}
                            subitems={item.subitems}
                            onDelete={deleteNote} 
                            onSaveFreeTextEdits={updateNote}
                            onAddSubitem={addNewSubitem}
                            onUpdateSubitemCheckbox={updateSubitemCheckbox}
                            onUpdateSubitemText={updateSubitemText}
                            onDeleteSubitem={deleteSubitem}
                          />
                        </div>
                      );
                    }}
                  </For>
                </SortableProvider>
              </div>
            </DragDropSensors>
          </DragDropProvider>
        </Show>
      </main>
      
      <footer class="text-right basis-auto mt-16 justify-center">
        <NewNote 
          onNoteAddedToDatabase={addNewNote}
          notesLength={notes()?.length || 0}
        />
      </footer>
    </>
  );
}