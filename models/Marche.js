const mongoose = require("mongoose");

const marcheSchema = mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  quartier: { type: String, required: true },
  arrondissement: { type: String, required: true },
  jourNettoyage: {
    type: String,
    enum: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
    default: null,
  },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Marche", marcheSchema);
