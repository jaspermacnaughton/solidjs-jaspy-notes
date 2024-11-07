import type { Component } from 'solid-js';

type NoteCardProps = {
  id: number;
  title: string,
  body: string,
  onDelete: (id: number) => void;
}

const NoteCard: Component<NoteCardProps> = (props) => {
  return (
    <div class="bg-white pt-2 p-4 ml-0 mb-0 m-4 text-center rounded-md shadow-md">
      <div class="flex items-center justify-between w-full">
        <div class="w-6"></div>
        <h2 class="flex-grow"><b>{props.title}</b> ({props.id})</h2>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => props.onDelete(props.id)}>
          delete
        </span>
      </div>
      
      <hr class="mb-2" />
      
      <p>{props.body}</p>
    </div>
  );
};

export default NoteCard;