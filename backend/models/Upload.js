import mongoose from 'mongoose';

const UploadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  uploadedAt: { type: String, default: () => new Date().toISOString() },
  rowCount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('Upload', UploadSchema);
