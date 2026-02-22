const Quartier = require("../models/Quartier");

// POST /api/quartier/create
exports.create = async (req, res) => {
  try {
    const { nom, arrondissement } = req.body;

    if (!nom || !arrondissement) {
      return res.status(400).json({ status: 1, message: "Nom et arrondissement requis" });
    }

    const quartier = new Quartier({ nom, arrondissement });
    await quartier.save();

    res.status(201).json({ status: 0, message: "Quartier créé", quartier });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: 2, message: "Ce quartier existe déjà" });
    }
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/quartier/all
exports.getAll = async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.arrondissement) {
      filter.arrondissement = req.query.arrondissement;
    }

    const quartiers = await Quartier.find(filter).sort({ nom: 1 });
    res.status(200).json({ status: 0, quartiers });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/quartier/:id
exports.update = async (req, res) => {
  try {
    const quartier = await Quartier.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!quartier) {
      return res.status(404).json({ status: 2, message: "Quartier introuvable" });
    }

    res.status(200).json({ status: 0, message: "Quartier mis à jour", quartier });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
