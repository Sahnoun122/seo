import mongoose from 'mongoose';

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
      type: String, // Storing as Markdown or HTML
      required: true,
    },
    suggestedKeywords: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

const Article = mongoose.model('Article', articleSchema);

export default Article;
