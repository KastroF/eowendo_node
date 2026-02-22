const mongoose = require("mongoose");

const paiementSchema = mongoose.Schema({
  commerceId: { type: mongoose.Schema.Types.ObjectId, ref: "Commerce" },
  nomCommerce: { type: String, required: true },
  typeTaxe: { type: String, required: true },
  montant: { type: Number, required: true },
  modePaiement: {
    type: String,
    enum: ["airtel_money", "moov_money", "especes"],
    required: true,
  },
  telephone: { type: String, default: "" },
  paymentId: { type: String, default: "" },
  reference: { type: String, default: "" },
  statut: {
    type: String,
    enum: ["en_attente", "payé"],
    default: "en_attente",
  },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  arrondissement: { type: String, default: "" },
  quartier: { type: String, default: "" },
  marche: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Paiement", paiementSchema);
