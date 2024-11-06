import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'


const noteSchema = z.object({
  id: z.number().int().positive().min(1),
  title: z.string().min(3).max(100),
  body: z.string()
})

// Instead of noteSchama, could manually define a Note type and use it in fakeNotes
// type Note = {
//   id: number,
//   title: string,
//   body: string
// };

type Note = z.infer<typeof noteSchema>

const fakeNotes: Note[] = [ 
  { id: 1, title: "First Note", body: "First Body" },
  { id: 2, title: "Remember to Stretch", body: "Quads, Hamstrings, and Shoulders" },
];

const createPostSchema = noteSchema.omit({id: true});
// const createPostSchema = z.object({ //manual way of .omit
//   title: z.string().min(3).max(100),
//   body: z.string()
// })

export const notesRoute = new Hono()
.get("/", async (c) => {
  return c.json(fakeNotes)
})
.post("/", zValidator("json", createPostSchema), async (c) => {
  //const note = createPostSchema.parse(data); // Could have done the zValidator manually
  const note = c.req.valid("json");
  const newNoteId = fakeNotes.length + 1;
  fakeNotes.push({...note, id: newNoteId})
  return c.json({"id": newNoteId});
})
.get("/:id{[0-9]+}", (c) => { // Regex makes sure there is an id in the note
  const id = Number.parseInt(c.req.param("id"));
  const note = fakeNotes.find(note => note.id == id);
  if (!note) {
    return c.notFound();   
  }
  return c.json({note});
})
// .delete("/:id{[0-9]+}", (c) => { // Regex makes sure there is an id in the note
//   const id = Number.parseInt(c.req.param("id"));
//   const index = fakeNotes.findIndex(note => note.id == id);
//   if (index === -1) {
//     return c.notFound();   
//   }
//   const deletedNote = fakeNotes.splice(index, 1)[0];
//   return c.json({deletedNote});
// })
// .put