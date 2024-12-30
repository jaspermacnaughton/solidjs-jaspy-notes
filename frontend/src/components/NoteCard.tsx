import { createSignal, type Component, For } from 'solid-js';

type Subitem = {
  text: string;
  isChecked: boolean;
}

type NoteCardProps = {
  note_id: number;
  title: string,
  body: string,
  subitems: Subitem[],
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
        <div class="flex flex-col flex-grow">{/* Editing note display*/}
          <textarea 
            class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
            value={currentBody()}
            onInput={(e) => setCurrentBody(e.currentTarget.value)}
            rows={currentBody().split('\n').length}
          />
          
          <div class="flex flex-col gap-2 mt-2">
            <For each={props.subitems}>
              {(subitem) => (
                <div class="flex items-center gap-2 mt-2 p-1 border border-gray-200 rounded-md">
                  <input type="checkbox" class="w-4 h-4 m-2 mr-1" checked={subitem.isChecked} />
                  <textarea class="flex-grow whitespace-pre-wrap text-left bg-gray-50 border border-gray-300 rounded-md p-1 resize-none"
                    value={subitem.text}
                    rows={subitem.text.split('\n').length}
                  />
                  <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle">
                    delete
                  </span>
                </div>
              )}
            </For>
          </div>
          
          <div class="flex items-center justify-between w-full mt-2">
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={() => {
                setCurrentBody(props.body);
                setIsEditing(false);
              }}>
              cancel
            </span>
            <span class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
              onClick={async () => {
                await props.onSaveEdit(props.note_id, currentBody());
                setIsEditing(false);
              }}>
              save
            </span>
          </div>
        </div>
      ) : (
        <div class="flex flex-col flex-grow">{/* Viewing note display*/}
          <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{props.body}</p>
          
          <div class="flex flex-col gap-2 mt-2">
            <For each={props.subitems}>
              {(subitem) => (
                <div class="flex items-center gap-2 mt-2 p-1 border border-gray-200 rounded-md">
                  <input type="checkbox" class="w-4 h-4 m-2 mr-1" checked={subitem.isChecked} />
                  <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">
                    {subitem.text}
                  </p>
                </div>
              )}
            </For>
          </div>
          
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