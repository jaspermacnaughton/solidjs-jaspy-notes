import { createSignal, For, Show } from "solid-js";
import { createSortable, DragDropProvider, DragDropSensors, DragEvent, SortableProvider, closestCenter, DragOverlay } from "@thisbeyond/solid-dnd";
import { useNavigate } from "@solidjs/router";

import { useAuth } from "../../context/AuthContext";
import { useNotes, NotesContextProvider } from "../../context/NotesContext";
import { Note } from '../../types/notes';
import NoteCard from "./components/NoteCard";
import NewNote from "./components/NewNote";

const NotesContent = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeDraggingNote, setActiveDraggingNote] = createSignal<Note | null>(null);
  const {
    notes,
    error,
    addNewNote,
    deleteNote,
    updateNoteTitle,
    updateNoteBody,
    addNewSubitem,
    updateSubitemCheckbox,
    updateSubitemText,
    deleteSubitem,
    updateNoteOrder,
    swapNotesLocally,
    noteIds
  } = useNotes();
  
  const handleLogout = () => {
    auth.logout();
    navigate("/login");
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
    swapNotesLocally(fromIndex, toIndex);
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
            <button onClick={handleLogout} class="btn text-sm sm:text-base">
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
          when={notes() !== undefined}
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
};

export default function Notes() {
  return (
    <NotesContextProvider>
      <NotesContent />
    </NotesContextProvider>
  );
}