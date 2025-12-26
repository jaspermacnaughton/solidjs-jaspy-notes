import { createSignal, For, Show, createEffect } from "solid-js";
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
  const { notes, orderedNoteIds, swapNotesLocally, updateNoteOrder } = useNotes();
  
  // Add authentication check effect to rerun whenever the auth signals change
  createEffect(() => {
    if (!auth.isLoading() && !auth.isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  });

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const handleDragStart = (event: DragEvent) => {
    setActiveDraggingNote(notes()?.find((note: Note) => note.noteId === Number(event.draggable.id)) || null);
  };
  
  const handleDragOver = ({ draggable, droppable }: DragEvent) => {
    if (!draggable || !droppable) return;
    
    const currentNotes = notes();
    if (!currentNotes) return;
    
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
    await updateNoteOrder(orderedNoteIds());
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
                <SortableProvider ids={orderedNoteIds()}>
                  <For each={notes()}>
                    {(note) => {
                      const sortable = createSortable(note.noteId);
                      return (
                        <div
                          ref={sortable.ref}
                          class="touch-none"
                          classList={{ "opacity-25": sortable.isActiveDraggable }}
                        >
                          <NoteCard note={note} sortable={sortable} />
                        </div>
                      );
                    }}
                  </For>
                </SortableProvider>
              </div>
            </DragDropSensors>
            <DragOverlay>
              <Show when={activeDraggingNote()}>
                <NoteCard note={activeDraggingNote()!} />
              </Show>
            </DragOverlay>
          </DragDropProvider>
        </Show>
      </main>
      
      <footer class="text-right basis-auto mt-16 justify-center">
        <NewNote />
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