import { createSignal, type Component, For } from 'solid-js';
import { SubitemType } from '../types/notes';
import Subitem from './Subitem';

type NoteCardProps = {
  note_id: number;
  title: string;
  body: string;
  subitems: SubitemType[];
  onDelete: (note_id: number) => void;
  onSaveEdit: (note_id: number, newBody: string, newSubitems: SubitemType[]) => Promise<void>;
  onUpdateSubitemCheckbox: (subitemId: number, isChecked: boolean) => Promise<void>;
}

const NoteCard: Component<NoteCardProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [currentBody, setCurrentBody] = createSignal(props.body);
  const [currentSubitems, setCurrentSubitems] = createSignal([
    ...props.subitems,
    { text: "", is_checked: false, note_id: props.note_id }
  ]);
  
  const saveBody = async () => {
    await props.onSaveEdit(props.note_id, currentBody(), currentSubitems());
    setIsEditing(false);
  };
 
  const addNewSubitem = () => {
    setCurrentSubitems([
      ...currentSubitems(),
      { text: "", is_checked: false, note_id: props.note_id }
    ]);
  }
  
  const deleteSubitem = (subitem: SubitemType) => {
    const updatedSubitems = currentSubitems().filter(item => item !== subitem);
    // Ensure we always have at least one empty item at the end
    if (updatedSubitems[updatedSubitems.length - 1]?.text !== "") {
      updatedSubitems.push({ text: "", is_checked: false, note_id: props.note_id });
    }
    setCurrentSubitems(updatedSubitems);
  };
  
  // Existing subitem functions
  const updateSubitemText = (subitem: SubitemType, newText: string) => {
    const index = currentSubitems().indexOf(subitem);
    const isLastItem = index === currentSubitems().length - 1;

    // If this is the last item and we're typing the first character
    if (isLastItem && subitem.text === "" && newText.length === 1) {
      setCurrentSubitems([
        ...currentSubitems(),
        { text: "", is_checked: false, note_id: props.note_id }
      ]);
    }

    // Update the text of the current item
    const updatedSubitems = currentSubitems().map(item =>
      item === subitem ? { ...item, text: newText } : item
    );
    setCurrentSubitems(updatedSubitems);
  };

  const toggleSubitemCheckbox = async (subitem: SubitemType) => {
    subitem.is_checked = !subitem.is_checked;
    
    if (!isEditing()) {
      try {
        if (subitem.subitem_id !== undefined) {
          // If the subitem has an ID, update the checkbox on the backend
          await props.onUpdateSubitemCheckbox(subitem.subitem_id, subitem.is_checked);
        }
      } catch (error) {
        // Revert the checkbox if the API call fails
        subitem.is_checked = !subitem.is_checked;
      }
    }
  };

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
      
      <div class="flex flex-col flex-grow">
        {isEditing() ? (
          <>{/* Editing note display*/}
            <textarea 
              id={`note-${props.note_id}-body`}
              class="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-1 resize-none" 
              value={currentBody()}
              onInput={(e) => setCurrentBody(e.currentTarget.value)}
              rows={currentBody().split('\n').length}
            />
            
            <div class="flex items-center justify-between w-full mt-2">
              <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                onClick={() => {
                  setCurrentBody(props.body);
                  setIsEditing(false);
                }}>
                cancel
              </button>
              <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                onClick={saveBody}>
                save
              </button>
            </div>
          </>
        ) : (
          <>{/* Viewing note display*/}
            <p class="flex-grow whitespace-pre-wrap text-left border border-transparent rounded-md p-1">{props.body}</p>
            
            <div class="flex items-center justify-end w-full mt-2">
              <button class="w-6 material-symbols-outlined hover:bg-neutral-800 hover:text-white cursor-pointer rounded-sm align-middle"
                onClick={() => setIsEditing(true)}>
                edit
              </button>
            </div>
          </>
        )}
      
        <div class="flex flex-col gap-2 mt-2">
          <For each={currentSubitems()}>
            {(subitem, index) => (
              <Subitem
                subitem={subitem}
                isLast={index() === currentSubitems().length - 1}
                onCheckboxToggled={toggleSubitemCheckbox}
                onTextUpdated={updateSubitemText}
                onLastSubitemTextAdded={addNewSubitem}
                onDelete={deleteSubitem}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;