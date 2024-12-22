import { createSignal, type Component } from 'solid-js';

type NoteCardProps = {
  note_id: number;
  title: string,
  body: string,
  onDelete: (note_id: number) => void;
  onEdit: (note_id: number) => void;
}

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);

  return (
    <div class="bg-white p-2 ml-0 mb-0 m-4 text-center rounded-md shadow-md">
      <div class="flex items-center justify-between w-full mb-1">
        <div class="w-6"></div>
        <h2 class="flex-grow"><b>{props.title}</b></h2>
        <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
          onClick={() => props.onDelete(props.note_id)}>
          delete
        </span>
      </div>
      
      <hr class="mb-2" />
      
      {isEditing() ? (
        <>
          <textarea value={props.body} class="w-full bg-gray-50 border border-gray-300 rounded-md p-1" />
          <div class="flex items-center justify-end w-full mt-2">
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => {
                props.onEdit(props.note_id);
                setIsEditing(false);
              }}>
              save
            </span>
          </div>
        </>
      ) : (
        <>
          <p>{props.body}</p>
          <div class="flex items-center justify-end w-full mt-2">
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => setIsEditing(true)}>
              edit
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default NoteCard;