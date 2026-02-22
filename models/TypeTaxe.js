const mongoose = require("mongoose");

const typeTaxeSchema = mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  frequence: {
    type: String,
    enum: ["journaliere", "hebdomadaire", "mensuelle", "trimestrielle", "annuelle"],
    required: true,
  },
  montantDefaut: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TypeTaxe", typeTaxeSchema);
