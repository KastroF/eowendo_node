const TypeTaxe = require("../models/TypeTaxe");

// POST /api/typetaxe/create
exports.create = async (req, res) => {
  try {
    const { nom, frequence, montantDefaut } = req.body;

    if (!nom || !frequence) {
      return res.status(400).json({ status: 1, message: "Nom et fréquence requis" });
    }

    const typeTaxe = new TypeTaxe({ nom, frequence, montantDefaut: montantDefaut || 0 });
    await typeTaxe.save();

    res.status(201).json({ status: 0, message: "Type de taxe créé", typeTaxe });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: 2, message: "Ce type de taxe existe déjà" });
    }
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/typetaxe/all
exports.getAll = async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.frequence) filter.frequence = req.query.frequence;

    const typesTaxes = await TypeTaxe.find(filter).sort({ nom: 1 });
    res.status(200).json({ status: 0, typesTaxes });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/typetaxe/:id
exports.update = async (req, res) => {
  try {
    const typeTaxe = await TypeTaxe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!typeTaxe) {
      return res.status(404).json({ status: 2, message: "Type de taxe introuvable" });
    }

    res.status(200).json({ status: 0, message: "Type de taxe mis à jour", typeTaxe });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
