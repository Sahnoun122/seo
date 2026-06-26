import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { getAllUsers, updateUserCredits, deleteUser } from '../controllers/adminController.js';
import { getDashboardStats } from '../controllers/statsController.js';
import { validate, updateCreditsSchema } from '../validators/schemas.js';

const router = express.Router();

// All routes below are protected and require admin privileges
router.use(protect, isAdmin);

router.get('/stats', getDashboardStats);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.route('/users/:id/credits')
  .put(validate(updateCreditsSchema), updateUserCredits);

export default router;
