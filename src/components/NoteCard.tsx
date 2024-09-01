import type { Component, JSXElement } from 'solid-js';
import { useJaspyNotesContext } from '../context/JaspyNotesContext';
import { produce } from 'solid-js/store';

type NoteCardProps = {
  title: string,
  body: string,
  arrayIndex: number;
  //children: JSXElement
}

const NoteCard: Component<NoteCardProps> = (props) => {
  
  const { notes, setNotes } = useJaspyNotesContext(); //TODO: can we pass this to the parent instead?
  
  const deleteNote = () => {
    console.log("deleting note");
    
    setNotes([...notes.slice(0, props.arrayIndex), ...notes.slice(props.arrayIndex + 1)]);
    
    // setNotes((prevNotes) => {
    //   const newNotes = [...prevNotes];
    //   newNotes.splice(props.arrayIndex, props.arrayIndex);
    //   return newNotes;
    // });
  }
  
  return (
    <div class="bg-white pt-2 p-4 m-4 text-center rounded-md shadow-md">
      <div class="flex items-center justify-between w-full">
        <div class="w-6"></div>
        <h2 class="flex-grow"><b>{props.title}</b></h2>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={deleteNote}>
          delete
        </span>
      </div>
      
      <hr class="mb-2" />
      
      <p>{props.body}</p>
      {/* {props.children} */}
    </div>
  );
};

export default NoteCard;