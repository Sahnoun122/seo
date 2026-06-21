import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  metaDescription: { type: String, required: true },
  content:         { type: String, required: true },
  refinedAt:       { type: Date,   default: Date.now },
}, { _id: false });

const articleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    metaDescription: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    suggestedKeywords: [{
      type: String,
    }],
    coverImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

articleSchema.index({ user: 1, createdAt: -1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
