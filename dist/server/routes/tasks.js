import express from 'express';
import { db } from '../db/index.js';
const router = express.Router();
// Get all tasks
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all tasks');
        const tasks = await db
            .selectFrom('tasks')
            .selectAll()
            .orderBy('created_at', 'desc')
            .execute();
        // Convert SQLite numeric boolean to JS boolean
        const formattedTasks = tasks.map(task => ({
            ...task,
            completed: Boolean(task.completed)
        }));
        res.json(formattedTasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// Create a new task
router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || title.trim() === '') {
            res.status(400).json({ error: 'Task title is required' });
            return;
        }
        console.log('Creating new task:', title);
        const result = await db
            .insertInto('tasks')
            .values({
            title: title.trim(),
            completed: 0
        })
            .returning(['id', 'title', 'completed', 'created_at'])
            .executeTakeFirst();
        if (!result) {
            res.status(500).json({ error: 'Failed to create task' });
            return;
        }
        res.status(201).json({
            ...result,
            completed: Boolean(result.completed)
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// Update task (toggle completion)
router.patch('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { completed } = req.body;
        if (typeof completed !== 'boolean') {
            res.status(400).json({ error: 'Completed status must be a boolean' });
            return;
        }
        console.log(`Updating task ${id}, completed: ${completed}`);
        const result = await db
            .updateTable('tasks')
            .set({ completed: completed ? 1 : 0 })
            .where('id', '=', id)
            .returning(['id', 'title', 'completed', 'created_at'])
            .executeTakeFirst();
        if (!result) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.json({
            ...result,
            completed: Boolean(result.completed)
        });
    }
    catch (error) {
        console.error(`Error updating task ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        console.log(`Deleting task ${id}`);
        const result = await db
            .deleteFrom('tasks')
            .where('id', '=', id)
            .executeTakeFirst();
        if (!result || result.numDeletedRows === 0n) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(`Error deleting task ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
export default router;
