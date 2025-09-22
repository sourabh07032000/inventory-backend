import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  password: String,
  company: String,
  role: { type: String, enum: ["superadmin", "admin", "wholesaler", "employee"], default: "wholesaler" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
