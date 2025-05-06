import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'

import { getPostgresClient } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import type { AuthedContext } from '../middleware/auth';

const createSubitemSchema = z.object({
  noteId: z.number().int(),
  text: z.string()
});

const updateSubitemCheckboxSchema = z.object({
  isCurrentlyChecked: z.boolean()
});

const updateSubitemTextSchema = z.object({
  text: z.string()
});

export const subitemsRoute = new Hono()
  .use('/*', authMiddleware)
  .post('/', zValidator('json', createSubitemSchema), async (c: AuthedContext) => {
  const postgresClient = getPostgresClient();
  
  try {
    const { noteId, text } = await c.req.json();
    
    await postgresClient.connect();
    
    // First verify the note belongs to the user
    const noteExistsCheck = await postgresClient.query(
      `SELECT note_id FROM public."Notes" 
      WHERE note_id = $1 AND user_id = $2`,
      [noteId, c.user!.user_id]
    );
    
    if (noteExistsCheck.rows.length === 0) {
      return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
    }
    
    // Create the new subitem
    const newSubitemRes = await postgresClient.query(
      `INSERT INTO public."Subitems" (note_id, text, is_checked)
      VALUES ($1, $2, false)
      RETURNING subitem_id`,
      [noteId, text]
    );
    
    return c.json({ 
      success: true, 
      subitemId: newSubitemRes.rows[0].subitem_id 
    });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.patch('/checkbox/:subitemId', zValidator('json', updateSubitemCheckboxSchema), async (c: AuthedContext) => {
  const postgresClient = getPostgresClient();
  
  try {
    const subitemId = Number(c.req.param('subitemId'));
    const updateData = await c.req.json();
    
    await postgresClient.connect();
    
    // First verify the subitem belongs to a note owned by the user
    const verifyRes = await postgresClient.query(
      `SELECT s.subitem_id 
       FROM public."Subitems" s
       JOIN public."Notes" n ON s.note_id = n.note_id
       WHERE s.subitem_id = $1 AND n.user_id = $2`,
      [subitemId, c.user!.user_id]
    );
    
    if (verifyRes.rows.length === 0) {
      return c.json({ success: false, error: 'Subitem not found or unauthorized' }, 404);
    }
    await postgresClient.query(
      `UPDATE public."Subitems" 
        SET is_checked = $1 
        WHERE subitem_id = $2`,
      [!updateData.isCurrentlyChecked, subitemId]
    );
    
    return c.json({ success: true });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.patch('/text/:subitemId', zValidator('json', updateSubitemTextSchema), async (c: AuthedContext) => {
  const postgresClient = getPostgresClient();
  
  try {
    const subitemId = Number(c.req.param('subitemId'));
    const updateData = await c.req.json();
    
    await postgresClient.connect();
    
    // First verify the subitem belongs to a note owned by the user
    const verifyRes = await postgresClient.query(
      `SELECT s.subitem_id 
       FROM public."Subitems" s
       JOIN public."Notes" n ON s.note_id = n.note_id
       WHERE s.subitem_id = $1 AND n.user_id = $2`,
      [subitemId, c.user!.user_id]
    );
    
    if (verifyRes.rows.length === 0) {
      return c.json({ success: false, error: 'Subitem not found or unauthorized' }, 404);
    }
    await postgresClient.query(
      `UPDATE public."Subitems" 
        SET text = $1 
        WHERE subitem_id = $2`,
      [updateData.text, subitemId]
    );
    
    return c.json({ success: true });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.delete('/:subitemId', async (c: AuthedContext) => {
  const postgresClient = getPostgresClient();
  
  try {
    const subitemId = Number(c.req.param('subitemId'));
    
    await postgresClient.connect();
    
    // First verify the subitem belongs to a note owned by the user
    const verifyRes = await postgresClient.query(
      `SELECT s.subitem_id 
       FROM public."Subitems" s
       JOIN public."Notes" n ON s.note_id = n.note_id
       WHERE s.subitem_id = $1 AND n.user_id = $2`,
      [subitemId, c.user!.user_id]
    );
    
    if (verifyRes.rows.length === 0) {
      return c.json({ success: false, error: 'Subitem not found or unauthorized' }, 404);
    }
    
    // Delete the subitem
    await postgresClient.query(
      `DELETE FROM public."Subitems" 
       WHERE subitem_id = $1`,
      [subitemId]
    );
    
    return c.json({ success: true });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})