import express from 'express';
import {
  uploadImages,
  getImagesByEntity,
  deleteImage,
  replaceImage,
  viewSecureImage,
  setPrimaryImage
} from '../controllers/imageController.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload multiple or single image
router.post('/upload', uploadMultiple, uploadImages);
router.post('/upload/single', uploadSingle, uploadImages);

// Get images for a specific entity
router.get('/', getImagesByEntity);

// Delete image
router.delete('/:id', deleteImage);

// Replace image
router.put('/:id/replace', uploadSingle, replaceImage);

// Set as primary
router.patch('/:id/primary', setPrimaryImage);

// Secure access view endpoint (redirects to signed URL)
router.get('/:id/view', viewSecureImage);

export default router;
