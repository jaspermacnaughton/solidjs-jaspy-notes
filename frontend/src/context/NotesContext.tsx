import { createContext, useContext, createResource, createSignal, ParentComponent, Resource } from "solid-js";
import { Note } from '../types/notes';
import { useAuth } from './AuthContext';
import { handleApiResponse } from '../utils/api';

interface NotesContextType {
  notes: Resource<Note[]>;
  orderedNoteIds: () => number[];
  error: () => string | null;
  addNewNote: (newNote: Omit<Note, 'noteId' | 'displayOrder'>) => Promise<void>;
  deleteNote: (idTodelete: number) => Promise<void>;
  updateNoteTitle: (noteId: number, newTitle: string) => Promise<void>;
  updateNoteBody: (noteId: number, newBody: string) => Promise<void>;
  addNewSubitem: (noteId: number, newText: string) => Promise<void>;
  updateSubitemCheckbox: (subitemId: number, isCurrentlyChecked: boolean) => Promise<void>;
  updateSubitemText: (subitemId: number, newText: string) => Promise<void>;
  deleteSubitem: (subitemId: number) => Promise<void>;
  swapNotesLocally: (fromIndex: number, toIndex: number) => void;
  updateNoteOrder: (noteIds: number[]) => Promise<void>;
}

const NotesContext = createContext<NotesContextType>();

export const NotesContextProvider: ParentComponent = (props) => {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);
  
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
  
  const [notes, { mutate: mutateNotes, refetch: refetchNotes }] = createResource<Note[], string>(
    () => auth.token(),
    () => fetchNotes().catch(err => {
      setError(err.message);
      throw err;
    }),
    {
      initialValue: []
    }
  );

  const orderedNoteIds = () => notes().map((note: Note) => note.noteId);
  
  const addNewNote = async (newNote: Omit<Note, 'noteId' | 'displayOrder'>) => {
    setError(null);
    
    if (newNote.title.trim() === "") {
      setError("Title is required");
      return;
    }
    
    try {
      let newNoteDisplayOrder = notes()?.length ?? 0;
      
      const newNoteWithDisplayOrder = {...newNote, displayOrder: newNoteDisplayOrder};
      
      const response = await fetch('api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify(newNoteWithDisplayOrder),
      });
      
      const data = await handleApiResponse(response, auth.logout);
      
      mutateNotes((existingNotes = []) => [...existingNotes, {noteId: data.noteId, ...newNoteWithDisplayOrder}]);
      
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
          noteId: idTodelete
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      mutateNotes((existingNotes = []) => {
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
      mutateNotes((existingNotes = []) => {
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
      mutateNotes((existingNotes = []) => {
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
      
      mutateNotes((existingNotes = []) => {
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
      
      throw new Error(err.message);
    }
  };

  const updateSubitemCheckbox = async (subitemId: number, isCurrentlyChecked: boolean) => {
    setError(null);
    
    try {
      const response = await fetch(`api/notes/subitems/checkbox/${subitemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          isCurrentlyChecked: isCurrentlyChecked
        }),
      });
      
      await handleApiResponse(response, auth.logout);
      
      mutateNotes((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.map(subitem => 
            subitem.subitemId === subitemId 
              ? { ...subitem, isChecked: !isCurrentlyChecked }
              : subitem
          )
        }));
      });
    } catch (err: any) {
      setError(err.message);
      
      refetchNotes();
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
      
      mutateNotes((existingNotes = []) => {
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
      
      refetchNotes();
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
      
      mutateNotes((existingNotes = []) => {
        return existingNotes.map((note: Note) => ({
          ...note,
          subitems: note.subitems.filter(subitem => subitem.subitemId !== subitemId)
        }));
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const swapNotesLocally = async (fromIndex: number, toIndex: number) => {
    mutateNotes((existingNotes = []) => {
      const updatedNotes = [...existingNotes];
      const [movedNote] = updatedNotes.splice(fromIndex, 1);
      updatedNotes.splice(toIndex, 0, movedNote);
      return updatedNotes.map((note, index) => ({
        ...note,
        displayOrder: index
      }));
    });
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

  return (
    <NotesContext.Provider value={{
      notes,
      orderedNoteIds,
      error,
      addNewNote,
      deleteNote,
      updateNoteTitle,
      updateNoteBody,
      addNewSubitem,
      updateSubitemCheckbox,
      updateSubitemText,
      deleteSubitem,
      swapNotesLocally,
      updateNoteOrder
    }}>
      {props.children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}; 