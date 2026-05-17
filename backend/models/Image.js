import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  imageableId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // can be null if uploaded independently before attaching
  },
  imageableType: {
    type: String,
    required: false
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  thumbnails: {
    small: String,
    medium: String,
    large: String
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for fast polymorphic lookups
imageSchema.index({ imageableId: 1, imageableType: 1 });

const Image = mongoose.model('Image', imageSchema);
export default Image;
