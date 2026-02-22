const Commerce = require("../models/Commerce");
const crypto = require("crypto");

// Generate unique QR code identifier
function generateQRCode() {
  return "OWD-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

// POST /api/commerce/enroll
exports.enroll = async (req, res) => {
  try {
    const {
      typeCommerce,
      nomCommerce,
      proprietaire,
      telephone,
      arrondissement,
      quartier,
      marche,
      numEmplacement,
      patente,
      typeTaxe,
    } = req.body;

    if (!typeCommerce || !nomCommerce || !proprietaire || !telephone || !arrondissement || !quartier || !typeTaxe) {
      return res.status(400).json({ status: 1, message: "Champs obligatoires manquants" });
    }

    const commerce = new Commerce({
      typeCommerce,
      nomCommerce,
      proprietaire,
      telephone,
      arrondissement,
      quartier,
      marche: marche || "",
      numEmplacement: numEmplacement || "",
      patente: patente || "",
      typeTaxe,
      qrCode: generateQRCode(),
      agentId: req.auth.userId,
    });

    await commerce.save();

    res.status(201).json({
      status: 0,
      message: "Commerce enrôlé avec succès",
      commerce,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/commerce/all
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, arrondissement, quartier, marche, search } = req.query;

    const filter = { active: true };
    if (arrondissement) filter.arrondissement = arrondissement;
    if (quartier) filter.quartier = quartier;
    if (marche) filter.marche = marche;
    if (search) {
      filter.$or = [
        { nomCommerce: { $regex: search, $options: "i" } },
        { proprietaire: { $regex: search, $options: "i" } },
      ];
    }

    const commerces = await Commerce.find(filter)
      .populate("agentId", "nom")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Commerce.countDocuments(filter);

    res.status(200).json({
      status: 0,
      commerces,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/commerce/:id
exports.getById = async (req, res) => {
  try {
    const commerce = await Commerce.findById(req.params.id).populate("agentId", "nom");
    if (!commerce) {
      return res.status(404).json({ status: 2, message: "Commerce introuvable" });
    }

    res.status(200).json({ status: 0, commerce });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/commerce/qr/:code
exports.getByQR = async (req, res) => {
  try {
    const commerce = await Commerce.findOne({ qrCode: req.params.code, active: true });
    if (!commerce) {
      return res.status(404).json({ status: 2, message: "Commerce introuvable pour ce QR code" });
    }

    res.status(200).json({ status: 0, commerce });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// PUT /api/commerce/:id
exports.update = async (req, res) => {
  try {
    const commerce = await Commerce.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!commerce) {
      return res.status(404).json({ status: 2, message: "Commerce introuvable" });
    }

    res.status(200).json({ status: 0, message: "Commerce mis à jour", commerce });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/commerce/count
exports.count = async (req, res) => {
  try {
    const total = await Commerce.countDocuments({ active: true });
    res.status(200).json({ status: 0, total });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
