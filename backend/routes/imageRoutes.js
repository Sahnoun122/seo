import express from 'express';
import {
  uploadImages,
  getImagesByEntity,
  deleteImage,
  replaceImage,
  viewSecureImage,
  setPrimaryImage
} from '../controllers/imageController.js';
import { searchUnsplash } from '../controllers/unsplashController.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload multiple or single image
router.post('/upload', protect, uploadMultiple, uploadImages);
router.post('/upload/single', protect, uploadSingle, uploadImages);

// Get images for a specific entity
router.get('/', protect, getImagesByEntity);

// Delete image
router.delete('/:id', protect, deleteImage);

// Replace image
router.put('/:id/replace', protect, uploadSingle, replaceImage);

// Set as primary
router.patch('/:id/primary', protect, setPrimaryImage);

// Secure access view endpoint (redirects to signed URL)
router.get('/:id/view', viewSecureImage);

// Unsplash photo search (proxied — keeps API key server-side)
router.get('/unsplash/search', protect, searchUnsplash);

export default router;
