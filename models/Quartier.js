const mongoose = require("mongoose");

const quartierSchema = mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  arrondissement: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quartier", quartierSchema);
