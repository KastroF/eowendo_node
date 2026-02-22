const Marche = require("../models/Marche");

// POST /api/marche/create
exports.create = async (req, res) => {
  try {
    const { nom, quartier, arrondissement, jourNettoyage } = req.body;

    if (!nom || !quartier || !arrondissement) {
      return res.status(400).json({ status: 1, message: "Nom, quartier et arrondissement requis" });
    }

    const marche = new Marche({ nom, quartier, arrondissement, jourNettoyage: jourNettoyage || null });
    await marche.save();

    res.status(201).json({ status: 0, message: "Marché créé", marche });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: 2, message: "Ce marché existe déjà" });
    }
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/marche/all
exports.getAll = async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.quartier) filter.quartier = req.query.quartier;
    if (req.query.arrondissement) filter.arrondissement = req.query.arrondissement;

    const marches = await Marche.find(filter).sort({ nom: 1 });
    res.status(200).json({ status: 0, marches });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/marche/:id
exports.update = async (req, res) => {
  try {
    const marche = await Marche.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!marche) {
      return res.status(404).json({ status: 2, message: "Marché introuvable" });
    }

    res.status(200).json({ status: 0, message: "Marché mis à jour", marche });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
