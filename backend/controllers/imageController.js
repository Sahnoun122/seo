import logger from '../utils/logger.js';
import Image from '../models/Image.js';
import ImageService from '../services/ImageService.js';

export const uploadImages = async (req, res) => {
  try {
    const { imageableId, imageableType, folder } = req.body;
    const isPrimary = req.body.isPrimary === 'true';

    let files = [];
    if (req.file) files.push(req.file);
    if (req.files) files = req.files;

    if (files.length === 0) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const uploadedImages = [];
    for (const file of files) {
      const targetFolder = folder || (imageableType ? imageableType.toLowerCase() + 's' : 'misc');
      const uploadResult = await ImageService.uploadImage(file, targetFolder);

      // Create database record
      const imageDoc = new Image({
        url: `/api/images/view/`, // Will be updated with actual ID below
        path: uploadResult.path,
        filename: uploadResult.filename,
        imageableId: imageableId || null,
        imageableType: imageableType || null,
        isPrimary: files.length === 1 ? isPrimary : false,
        thumbnails: uploadResult.thumbnails,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype
      });
      
      await imageDoc.save();
      
      // Update URL with actual ID for secure access
      imageDoc.url = `/api/images/${imageDoc._id}/view`;
      await imageDoc.save();

      uploadedImages.push(imageDoc);
    }

    res.status(201).json({ success: true, data: uploadedImages });
  } catch (error) {
    logger.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Image upload failed.' });
  }
};

export const getImagesByEntity = async (req, res) => {
  try {
    const { imageableId, imageableType } = req.query;
    if (!imageableId || !imageableType) {
      return res.status(400).json({ error: 'imageableId and imageableType are required.' });
    }

    const images = await Image.find({ imageableId, imageableType }).sort({ isPrimary: -1, createdAt: -1 });
    
    const imagesWithUrls = await Promise.all(images.map(async img => {
      const doc = img.toJSON();
      doc.secureUrl = `/api/images/${img._id}/view`;
      doc.secureThumbnails = {
        small: `/api/images/${img._id}/view?size=small`,
        medium: `/api/images/${img._id}/view?size=medium`,
        large: `/api/images/${img._id}/view?size=large`
      };
      return doc;
    }));

    res.status(200).json({ success: true, data: imagesWithUrls });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve images.' });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    const pathsToDelete = [
      image.path,
      image.thumbnails.small,
      image.thumbnails.medium,
      image.thumbnails.large
    ].filter(Boolean);

    await ImageService.deleteImagePaths(pathsToDelete);
    await image.deleteOne();

    res.status(200).json({ success: true, message: 'Image deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image.' });
  }
};

export const replaceImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No replacement image provided.' });
    }

    const oldImage = await Image.findById(id);
    if (!oldImage) {
      return res.status(404).json({ error: 'Image not found.' });
    }

    const targetFolder = oldImage.path.split('/')[0] || 'misc'; // Extract old folder

    // Upload new image
    const uploadResult = await ImageService.uploadImage(req.file, targetFolder);

    // Delete old files from S3
    const pathsToDelete = [
      oldImage.path,
      oldImage.thumbnails.small,
      oldImage.thumbnails.medium,
      oldImage.thumbnails.large
    ].filter(Boolean);
    await ImageService.deleteImagePaths(pathsToDelete);

    // Update database
    oldImage.path = uploadResult.path;
    oldImage.filename = uploadResult.filename;
    oldImage.thumbnails = uploadResult.thumbnails;
    oldImage.size = uploadResult.size;
    oldImage.mimetype = uploadResult.mimetype;
    await oldImage.save();

    res.status(200).json({ success: true, data: oldImage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to replace image.' });
  }
};

export const viewSecureImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { size } = req.query; // 'small', 'medium', 'large' or undefined for original

    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    let targetPath = image.path;
    if (size && image.thumbnails[size]) {
      targetPath = image.thumbnails[size];
    }

    // Production (S3/MinIO): redirect to a pre-signed URL
    const signedUrl = await ImageService.getSignedImageUrl(targetPath);
    if (signedUrl) {
      return res.redirect(302, signedUrl);
    }

    // Development: serve directly from local disk
    const localPath = ImageService.getLocalFilePath(targetPath);
    res.sendFile(localPath);
  } catch (error) {
    logger.error('View Image Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve image.' });
  }
};

export const setPrimaryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    
    if (!image) return res.status(404).json({ error: 'Image not found.' });

    // Remove primary flag from other images of the same entity
    if (image.imageableId && image.imageableType) {
      await Image.updateMany(
        { imageableId: image.imageableId, imageableType: image.imageableType },
        { isPrimary: false }
      );
    }

    image.isPrimary = true;
    await image.save();

    res.status(200).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set primary image.' });
  }
};
