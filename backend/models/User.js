import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Keeping flat text as per user instructions for hackathon mocks
  companyName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
