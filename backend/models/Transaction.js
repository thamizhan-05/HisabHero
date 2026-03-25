import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadId: { type: String, required: true },
  date: { type: String, required: true }, // Format matching current setup (YYYY-MM-DD string)
  description: { type: String, required: true },
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);
