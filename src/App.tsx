import { createSignal, For, Show, type Component } from 'solid-js';
import NoteCard from './components/NoteCard';
import { useJaspyNotesContext } from './context/JaspyNotesContext';

const App: Component = () => {
  const [isAddingNewNote, setIsAddingNewNote] = createSignal(true);
  
  const [newTitle, setNewTitle] = createSignal("");
  const [newBody, setNewBody] = createSignal("");
  
  const formReadyToSubmit = () => ((newTitle() != "") && (newTitle() != ""));

  
  const { notes, setNotes } = useJaspyNotesContext();
  
  const beginNewNote = () => {
    setIsAddingNewNote(true);
  }
 
  const saveNewNote = () => {
    //setNotes([...notes, {title: "Added Card", body: "This card was just added!"}])
    if (formReadyToSubmit()) {
      setNotes(notes.length, {title: newTitle(), body: newBody()});
      setNewTitle("");
      setNewBody("");
    }
    setIsAddingNewNote(false);
  }
  
  return (
    <>
      <header class="my-4 p-2 text-xl flex items-center justify-center gap-4">
        <h1>Jaspy Notes</h1>
      </header>
      
      <main class="flex-1">
        {/* <div class="flex flex-row flex-wrap justify-evenly"> */}
        <div class="grid grid-cols-4">
          <For each={notes}>
            {(item, index) => (
              <NoteCard title={item.title} body={item.body} arrayIndex={index()} />
            )}
          </For>
        </div>
      </main>
      
      <footer class="text-right basis-auto m-4 justify-center">
      <Show
        when={isAddingNewNote()}
        fallback={<button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" onClick={beginNewNote}>+</button>}
      >
        
        <div class="bg-white rounded-md shadow-md float-right w-1/4">
          <form onSubmit={saveNewNote} class="flex flex-col">
            <h3 class="text-center m-2 text-xl"><b>New Note</b></h3>
            
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
              <button class="w-12 h-12 m-4 p-0 btn text-xlg items-center justify-center" disabled={!formReadyToSubmit} onClick={saveNewNote}>+</button>
            </div>
          </form>
        </div>
      </Show>
        {/* <span class="material-symbols-outlined md-12 cursor-pointer justify-center rounded-md h-px hover:bg-neutral-900 hover:text-white">add_circle</span> */}
      </footer>
    </>
  );
};

export default App;
