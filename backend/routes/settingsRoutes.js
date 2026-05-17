import express from 'express';
import { getSettings, updateSettings, updateUserCredits, deleteUser } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Fetch settings details
router.get('/', protect, getSettings);

// Update general profile/global settings
router.put('/', protect, updateSettings);

// Update a specific user's credits and roles (Admin only inside controller)
router.put('/users/:id', protect, updateUserCredits);

// Delete a specific user account (Admin only inside controller)
router.delete('/users/:id', protect, deleteUser);

export default router;
