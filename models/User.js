const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  nom: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telephone: { type: String, default: "" },
  role: {
    type: String,
    enum: ["agent", "superviseur", "admin"],
    default: "agent",
  },
  arrondissement: { type: String, default: "" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
