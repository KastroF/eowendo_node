const mongoose = require("mongoose");

const commerceSchema = mongoose.Schema({
  typeCommerce: { type: String, required: true },
  nomCommerce: { type: String, required: true },
  proprietaire: { type: String, required: true },
  telephone: { type: String, required: true },
  arrondissement: { type: String, required: true },
  quartier: { type: String, required: true },
  marche: { type: String, default: "" },
  numEmplacement: { type: String, default: "" },
  patente: { type: String, default: "" },
  typeTaxe: { type: String, required: true },
  qrCode: { type: String, unique: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Commerce", commerceSchema);
