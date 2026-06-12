import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { getAllUsers, updateUserCredits, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

// All routes below are protected and require admin privileges
router.use(protect, isAdmin);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.route('/users/:id/credits')
  .put(updateUserCredits);

export default router;
