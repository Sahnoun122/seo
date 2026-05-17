import mongoose from 'mongoose';

const internalLinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  },
  content: {
    type: String,
    required: true,
  },
  suggestions: [
    {
      anchorText: String,
      suggestedUrl: String,
      context: String,
      relevanceScore: Number,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const InternalLink = mongoose.model('InternalLink', internalLinkSchema);

export default InternalLink;
