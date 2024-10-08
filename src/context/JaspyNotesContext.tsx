import { Component, createContext, JSXElement, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

export type JaspyNotesType = {
  title: string,
  body: string
}

export type JaspyNotesContextType = {
  notes: JaspyNotesType[];
  setNotes: SetStoreFunction<JaspyNotesType[]>;
}

export const JaspyNotesContext = createContext<JaspyNotesContextType>()

type JaspyNotesProviderProps = {
  children?: JSXElement;
}

export function JaspyNotesContextProvider(props: JaspyNotesProviderProps) {
  //const [items, setItems] = createStore(new Array<JaspyNotesType>())
  
  const [notes, setNotes] = createStore([
    {title: "Example Note 1", body: "This is the first notes body"},
    {title: "Example Note 2", body: "This is the second notes body"},
    {title: "Example Note 3", body: "This is NUMBA three"}
  ]);

  return (
    <JaspyNotesContext.Provider value={{ notes, setNotes }}>
      {props.children}
    </JaspyNotesContext.Provider>
  )
}

export function useJaspyNotesContext() {
  const context = useContext(JaspyNotesContext);
  if (!context) throw new Error("CartContext is not valid");
  return context;
}