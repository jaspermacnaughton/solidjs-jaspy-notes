import { createSignal, type Component } from 'solid-js';

type NoteCardProps = {
  note_id: number;
  title: string,
  body: string,
  onDelete: (note_id: number) => void;
  onSaveEdit: (note_id: number, body: string) => void;
}

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.body);

  return (
    <div class="bg-white p-2 mx-auto sm:mx-0 mb-0 m-4 text-center rounded-md shadow-md flex flex-col min-h-[150px] w-[95%] sm:w-full">
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
        <div class="flex flex-col flex-grow">
          {/* Editing note display*/}
          <textarea 
            class="w-full flex-grow bg-gray-50 border border-gray-300 rounded-md p-1" 
            value={currentBody()}
            onInput={(e) => setCurrentBody(e.currentTarget.value)}
          />
          <div class="flex items-center justify-between w-full mt-2">
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => {
                setCurrentBody(props.body);
                setIsEditing(false);
              }}>
              cancel
            </span>
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => {
                props.onSaveEdit(props.note_id, currentBody());
                setIsEditing(false);
              }}>
              save
            </span>
          </div>
        </div>
      ) : (
        <div class="flex flex-col flex-grow">
          {/* Viewing note display*/}
          <p class="flex-grow whitespace-pre-wrap text-left p-1 border border-transparent rounded-md">{props.body}</p>
          <div class="flex items-center justify-end w-full mt-2">
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => setIsEditing(true)}>
              edit
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;