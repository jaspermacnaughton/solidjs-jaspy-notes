import { createResource, createSignal, For, Show, type Component } from 'solid-js';
import NoteCard from './components/NoteCard';
import { JaspyNotesType } from './context/JaspyNotesContext';

const loadNotes = async (): Promise<JaspyNotesType[]> => {
    const response = await fetch("api/notes");
    return response.json();
  }

const App: Component = () => {
  const [notes, {mutate}] = createResource<JaspyNotesType[]>(loadNotes);
  
  const [isAddingNewNote, setIsAddingNewNote] = createSignal(true);
  const [newTitle, setNewTitle] = createSignal("Example Title");
  const [newBody, setNewBody] = createSignal("Example Body");
  
  const [error, setError] = createSignal(null);

  const postNewNote = async () => {
    setError(null);
    
    try {
      const response = await fetch('api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle(), 
          body: newBody()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save new note.');
      }

      const result = await response.json();
      
      mutate((existingNotes = []) => {
        return [...existingNotes, { id: result.id, title: newTitle(), body: newBody() }]
      });
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div class="p-4">
      <header class="my-4 p-2 flex items-center justify-center">
        <h1 class="text-2xl mb-4">Jaspy Notes</h1>
      </header>
      
      {error() && (
        <div class="text-red-500 bg-red-200 px-4 py-2 mb-2 rounded">
          Error: {error()}
        </div>
      )}
      
      <main class="flex-1">
        <Show
          when={!notes.loading} /*notes.error / notes.error.message */
          fallback={<div>Loading...</div>}
        >
          <pre class="bg-gray-100 p-4 rounded">
            {JSON.stringify(notes(), null, 2)}
          </pre>
          {/* <div class="grid sticky-grid">
            <For each={notes()}>
              {(item, index) => (
                <NoteCard title={item.title} body={item.body} arrayIndex={index()} />
              )}
            </For>
          </div> */}
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
    </div>
  );
}

export default App;