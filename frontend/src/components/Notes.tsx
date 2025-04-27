import { createResource, createSignal, For, Show } from "solid-js";
import { createSortable, DragDropProvider, DragDropSensors, DragEvent, SortableProvider, closestCenter, DragOverlay } from "@thisbeyond/solid-dnd";

import { useAuth } from "../context/AuthContext";
import { handleApiResponse } from "../utils/api";
import { Note } from '../types/notes';
import NoteCard from "./NoteCard";
import NewNote from "./NewNote";

export default function Notes() {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  const [activeDraggingNote, setActiveDraggingNote] = createSignal<Note | null>(null);
  
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
  const noteIds = () => notes().map((note: Note) => note.noteId);

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
          noteId: idTodelete
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        const updatedNotes = [...existingNotes];
        const indexToDelete = existingNotes.findIndex((note: Note) => note.noteId == idTodelete);
        if (indexToDelete === -1) {
          throw new Error(`Failed to delete note ${idTodelete}`);
        }
        updatedNotes.splice(indexToDelete, 1);
        // Update display order for remaining notes
        return updatedNotes.map((note, index) => ({
          ...note,
          displayOrder: index
        }));
      });
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateNoteTitle = async (noteId: number, newTitle: string) => {
    setError(null);
    
    try {
      const response = await fetch('api/notes/title', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          noteId: noteId,
          title: newTitle
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => 
          note.noteId === noteId 
            ? { 
                ...note, 
                title: newTitle,
              }
            : note
        );
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateNoteBody = async (noteId: number, newBody: string) => {
    setError(null);
    
    try {
      const response = await fetch('api/notes/body', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          noteId: noteId,
          body: newBody
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => 
          note.noteId === noteId 
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
          noteId: noteId,
          text: newText
        }),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => 
          note.noteId === noteId
            ? {
                ...note,
                subitems: [...note.subitems, { subitemId: data.subitemId, text: newText, isChecked: false, noteId: noteId }]
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
          isChecked: isChecked
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      
      mutate((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.map(subitem => 
            subitem.subitemId === subitemId 
              ? { ...subitem, isChecked: isChecked }
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
            subitem.subitemId === subitemId
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
          subitems: note.subitems.filter(subitem => subitem.subitemId !== subitemId)
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
          noteIds: noteIds
        }),
      });
      
      await handleApiResponse(response, auth.logout);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDraggingNote(notes().find((note: Note) => note.noteId === Number(event.draggable.id)) || null);
  };
  
  const handleDragOver = ({ draggable, droppable }: DragEvent) => {
    if (!draggable || !droppable) return;
    
    const currentNotes = notes();
    const fromIndex = currentNotes.findIndex((note: Note) => note.noteId === Number(draggable.id));
    const toIndex = currentNotes.findIndex((note: Note) => note.noteId === Number(droppable.id));
    
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;
    
    // Update our local state while user is dragging a note
    mutate((existingNotes = []) => {
      const updatedNotes = [...existingNotes];
      const [movedNote] = updatedNotes.splice(fromIndex, 1);
      updatedNotes.splice(toIndex, 0, movedNote);
      
      // Update displayOrder for all notes
      return updatedNotes.map((note, index) => ({
        ...note,
        displayOrder: index
      }));
    });
  };

  const handleDragEnd = async () => {
    setActiveDraggingNote(null);
        
    // Post the reordered note IDs to the database after note has been released
    await updateNoteOrder(noteIds());
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
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetector={closestCenter}
          >
            <DragDropSensors>
              <div class="grid sticky-grid">
                <SortableProvider ids={noteIds()}>
                  <For each={notes()}>
                    {(note) => {
                      const sortable = createSortable(note.noteId);
                      return (
                        <div
                          ref={sortable.ref}
                          class="touch-none"
                          classList={{ "opacity-25": sortable.isActiveDraggable }}
                        >
                          <NoteCard
                            note={note}
                            sortable={sortable}
                            onDelete={deleteNote}
                            onSaveTitleEdits={updateNoteTitle}
                            onSaveFreeTextBodyEdits={updateNoteBody}
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
            <DragOverlay>
              <Show when={activeDraggingNote()}>
                <NoteCard 
                  note={activeDraggingNote()!}
                  onDelete={deleteNote} 
                  onSaveTitleEdits={updateNoteTitle}
                  onSaveFreeTextBodyEdits={updateNoteBody}
                  onAddSubitem={addNewSubitem}
                  onUpdateSubitemCheckbox={updateSubitemCheckbox}
                  onUpdateSubitemText={updateSubitemText}
                  onDeleteSubitem={deleteSubitem}
                />
              </Show>
            </DragOverlay>
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