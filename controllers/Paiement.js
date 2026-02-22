const Paiement = require("../models/Paiement");
const Commerce = require("../models/Commerce");
const TypeTaxe = require("../models/TypeTaxe");
const Marche = require("../models/Marche");
const { getIO } = require("../socket");

// Jours de la semaine en français
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Vérifier si c'est le jour de nettoyage du marché (taxe journalière)
async function checkJourNettoyage(typeTaxe, marche) {
  if (!marche) return null;

  // Vérifier si la taxe est journalière
  const taxe = await TypeTaxe.findOne({ nom: typeTaxe, active: true });
  if (!taxe || taxe.frequence !== "journaliere") return null;

  // Vérifier le jour de nettoyage du marché
  const marcheDoc = await Marche.findOne({ nom: marche, active: true });
  if (!marcheDoc || !marcheDoc.jourNettoyage) return null;

  const aujourdHui = JOURS[new Date().getDay()];
  if (aujourdHui === marcheDoc.jourNettoyage) {
    return `Aujourd'hui (${marcheDoc.jourNettoyage}) est le jour de nettoyage du ${marche}. Les taxes journalières ne sont pas perçues ce jour.`;
  }

  return null;
}

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

    // Vérifier le jour de nettoyage
    const jourNettoyageMsg = await checkJourNettoyage(typeTaxe, marche);
    if (jourNettoyageMsg) {
      return res.status(400).json({ status: 3, message: jourNettoyageMsg });
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

    // Vérifier le jour de nettoyage
    const jourNettoyageMsg = await checkJourNettoyage(typeTaxe, marche);
    if (jourNettoyageMsg) {
      return res.status(400).json({ status: 3, message: jourNettoyageMsg });
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

    const { paymentId, bill_id, status } = req.body;

    if (!paymentId) {
      return res.status(200).json({ status: 0, message: "Thanks" });
    }

    if (status === "success") {
      const paiement = await Paiement.findOneAndUpdate(
        { paymentId },
        { statut: "payé", reference: bill_id || "" },
        { new: true }
      );

      if (paiement) {
        console.log("Callback: paiement confirmé:", paiement._id, "bill_id:", bill_id);

        // Notifier l'agent en temps réel via Socket.io
        const io = getIO();
        if (io) {
          io.to(`agent_${paiement.agentId}`).emit("payment:confirmed", {
            paiementId: paiement._id,
            nomCommerce: paiement.nomCommerce,
            montant: paiement.montant,
            typeTaxe: paiement.typeTaxe,
            reference: bill_id || "",
            statut: "payé",
          });
        }
      } else {
        console.log("Callback: paiement introuvable pour paymentId:", paymentId);
      }
    }

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

// GET /api/paiement/impayes - Commerces en retard de paiement
exports.getImpayes = async (req, res) => {
  try {
    const { page = 1, limit = 20, arrondissement, quartier, marche } = req.query;

    // Récupérer tous les types de taxes avec leur fréquence
    const typesTaxes = await TypeTaxe.find({ active: true });
    const frequenceMap = {};
    typesTaxes.forEach((t) => {
      frequenceMap[t.nom] = t.frequence;
    });

    // Récupérer les marchés pour les jours de nettoyage
    const marches = await Marche.find({ active: true });
    const nettoyageMap = {};
    marches.forEach((m) => {
      nettoyageMap[m.nom] = m.jourNettoyage;
    });

    // Filtre sur les commerces
    const commerceFilter = { active: true };
    if (arrondissement) commerceFilter.arrondissement = arrondissement;
    if (quartier) commerceFilter.quartier = quartier;
    if (marche) commerceFilter.marche = marche;

    const commerces = await Commerce.find(commerceFilter);

    const now = new Date();
    const impayes = [];

    for (const commerce of commerces) {
      const frequence = frequenceMap[commerce.typeTaxe];
      if (!frequence) continue; // Type de taxe inconnu, on skip

      // Dernier paiement confirmé pour ce commerce
      const dernierPaiement = await Paiement.findOne({
        commerceId: commerce._id,
        statut: "payé",
      }).sort({ createdAt: -1 });

      const dernierePaie = dernierPaiement ? dernierPaiement.createdAt : null;

      // Calculer le retard selon la fréquence
      let enRetard = false;
      let joursRetard = 0;
      let periodesRetard = 0;

      if (!dernierePaie) {
        // Jamais payé
        enRetard = true;
        const diffMs = now - commerce.createdAt;
        joursRetard = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      } else {
        const diffMs = now - dernierePaie;
        joursRetard = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        switch (frequence) {
          case "journaliere":
            // En retard si le dernier paiement date de plus d'un jour
            // Exclure les jours de nettoyage pour les marchés
            let joursExclus = 0;
            if (commerce.marche && nettoyageMap[commerce.marche]) {
              // Compter les jours de nettoyage dans la période de retard
              const jourNettoyage = nettoyageMap[commerce.marche];
              const jourIndex = JOURS.indexOf(jourNettoyage);
              if (jourIndex !== -1) {
                for (let i = 1; i <= joursRetard; i++) {
                  const d = new Date(dernierePaie);
                  d.setDate(d.getDate() + i);
                  if (d.getDay() === jourIndex) joursExclus++;
                }
              }
            }
            const joursEffectifs = joursRetard - joursExclus;
            enRetard = joursEffectifs > 1;
            periodesRetard = Math.max(0, joursEffectifs - 1);
            break;
          case "hebdomadaire":
            enRetard = joursRetard > 7;
            periodesRetard = Math.max(0, Math.floor(joursRetard / 7) - 1);
            break;
          case "mensuelle":
            enRetard = joursRetard > 30;
            periodesRetard = Math.max(0, Math.floor(joursRetard / 30) - 1);
            break;
          case "trimestrielle":
            enRetard = joursRetard > 90;
            periodesRetard = Math.max(0, Math.floor(joursRetard / 90) - 1);
            break;
          case "annuelle":
            enRetard = joursRetard > 365;
            periodesRetard = Math.max(0, Math.floor(joursRetard / 365) - 1);
            break;
        }
      }

      if (enRetard) {
        impayes.push({
          commerce: {
            _id: commerce._id,
            nomCommerce: commerce.nomCommerce,
            proprietaire: commerce.proprietaire,
            telephone: commerce.telephone,
            typeTaxe: commerce.typeTaxe,
            arrondissement: commerce.arrondissement,
            quartier: commerce.quartier,
            marche: commerce.marche,
          },
          frequence,
          dernierPaiement: dernierePaie,
          joursRetard,
          periodesRetard,
        });
      }
    }

    // Trier par retard décroissant
    impayes.sort((a, b) => b.joursRetard - a.joursRetard);

    // Pagination
    const total = impayes.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = impayes.slice(start, start + Number(limit));

    res.status(200).json({
      status: 0,
      impayes: paginated,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
