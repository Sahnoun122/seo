import mongoose from 'mongoose';

const processedPaymentSchema = new mongoose.Schema({
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  credits: {
    type: Number,
    required: true,
  },
  packageId: {
    type: String,
    default: '',
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

const ProcessedPayment = mongoose.model('ProcessedPayment', processedPaymentSchema);
export default ProcessedPayment;
