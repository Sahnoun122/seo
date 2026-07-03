import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, updateSettingsSchema } from '../validators/schemas.js';

const router = express.Router();

// Fetch settings details
router.get('/', protect, getSettings);

// Update general profile/global settings
router.put('/', protect, validate(updateSettingsSchema), updateSettings);

// NOTE: user credit/role management and account deletion for admins live
// exclusively under /api/admin/users/:id (routes/adminRoutes.js), which is
// protected by the isAdmin middleware. Do not re-expose them here.

export default router;
