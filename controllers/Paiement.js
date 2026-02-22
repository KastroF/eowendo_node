const Paiement = require("../models/Paiement");
const Commerce = require("../models/Commerce");

// POST /api/paiement/create
exports.create = async (req, res) => {
  try {
    const { nomCommerce, typeTaxe, montant, modePaiement, reference, commerceId, telephone, paymentId } = req.body;

    if (!nomCommerce || !typeTaxe || !montant || !modePaiement) {
      return res.status(400).json({ status: 1, message: "Champs obligatoires manquants" });
    }

    // Get commerce info for location data
    let arrondissement = "";
    let quartier = "";
    let marche = "";

    if (commerceId) {
      const commerce = await Commerce.findById(commerceId);
      if (commerce) {
        arrondissement = commerce.arrondissement;
        quartier = commerce.quartier;
        marche = commerce.marche;
      }
    }

    const paiement = new Paiement({
      commerceId: commerceId || null,
      nomCommerce,
      typeTaxe,
      montant: Number(montant),
      modePaiement,
      telephone: telephone || "",
      paymentId: paymentId || "",
      reference: reference || "",
      statut: "en_attente",
      agentId: req.auth.userId,
      arrondissement,
      quartier,
      marche,
    });

    await paiement.save();

    res.status(201).json({
      status: 0,
      message: "Paiement enregistré",
      paiement,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/paiement/confirm/:id
exports.confirm = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(
      req.params.id,
      { statut: "payé" },
      { new: true }
    );

    if (!paiement) {
      return res.status(404).json({ status: 2, message: "Paiement introuvable" });
    }

    res.status(200).json({
      status: 0,
      message: "Paiement confirmé",
      paiement,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/paiement/pay (create + confirm in one step)
exports.pay = async (req, res) => {
  try {
    const { nomCommerce, typeTaxe, montant, modePaiement, reference, commerceId, telephone, paymentId } = req.body;

    if (!nomCommerce || !typeTaxe || !montant || !modePaiement) {
      return res.status(400).json({ status: 1, message: "Champs obligatoires manquants" });
    }

    let arrondissement = "";
    let quartier = "";
    let marche = "";

    if (commerceId) {
      const commerce = await Commerce.findById(commerceId);
      if (commerce) {
        arrondissement = commerce.arrondissement;
        quartier = commerce.quartier;
        marche = commerce.marche;
      }
    }

    const paiement = new Paiement({
      commerceId: commerceId || null,
      nomCommerce,
      typeTaxe,
      montant: Number(montant),
      modePaiement,
      telephone: telephone || "",
      paymentId: paymentId || "",
      reference: reference || "",
      statut: "payé",
      agentId: req.auth.userId,
      arrondissement,
      quartier,
      marche,
    });

    await paiement.save();

    res.status(201).json({
      status: 0,
      message: "Paiement effectué avec succès",
      paiement,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/paiement/callback (called by payment gateway - no auth)
exports.callback = async (req, res) => {
  try {
    console.log("Payment callback received:", req.body);

    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ status: 1, message: "paymentId manquant" });
    }

    const paiement = await Paiement.findOneAndUpdate(
      { paymentId },
      { statut: "payé" },
      { new: true }
    );

    if (!paiement) {
      console.log("Callback: paiement introuvable pour paymentId:", paymentId);
      return res.status(200).json({ status: 0, message: "Thanks" });
    }

    console.log("Callback: paiement confirmé:", paiement._id);
    res.status(200).json({ status: 0, message: "Thanks" });
  } catch (err) {
    console.log("Callback error:", err.message);
    res.status(200).json({ status: 0, message: "Thanks" });
  }
};

// GET /api/paiement/pending
exports.getPending = async (req, res) => {
  try {
    const filter = { statut: "en_attente" };

    // Agents see only their own, admin/superviseur see all
    if (req.auth.role === "agent") {
      filter.agentId = req.auth.userId;
    }

    const paiements = await Paiement.find(filter)
      .populate("agentId", "nom")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 0, paiements });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/paiement/history
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, search } = req.query;

    const filter = {};

    if (req.auth.role === "agent") {
      filter.agentId = req.auth.userId;
    }

    if (statut) filter.statut = statut;
    if (search) {
      filter.nomCommerce = { $regex: search, $options: "i" };
    }

    const paiements = await Paiement.find(filter)
      .populate("agentId", "nom")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Paiement.countDocuments(filter);

    res.status(200).json({
      status: 0,
      paiements,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
