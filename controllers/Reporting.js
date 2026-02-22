const Paiement = require("../models/Paiement");
const Commerce = require("../models/Commerce");

// Helper: get date range for period
function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "jour":
      start.setHours(0, 0, 0, 0);
      break;
    case "semaine":
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      start.setHours(0, 0, 0, 0);
      break;
    case "mois":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "annee":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

// GET /api/reporting/stats
exports.getStats = async (req, res) => {
  try {
    const { period = "mois", arrondissement, quartier, marche } = req.query;
    const { start, end } = getDateRange(period);

    const matchFilter = { createdAt: { $gte: start, $lte: end } };
    if (arrondissement) matchFilter.arrondissement = arrondissement;
    if (quartier) matchFilter.quartier = quartier;
    if (marche) matchFilter.marche = marche;

    // Total collected (paid)
    const collecteResult = await Paiement.aggregate([
      { $match: { ...matchFilter, statut: "payé" } },
      { $group: { _id: null, total: { $sum: "$montant" }, count: { $sum: 1 } } },
    ]);

    // Total pending
    const impayesResult = await Paiement.aggregate([
      { $match: { ...matchFilter, statut: "en_attente" } },
      { $group: { _id: null, total: { $sum: "$montant" }, count: { $sum: 1 } } },
    ]);

    // Enrollments count
    const commerceFilter = { createdAt: { $gte: start, $lte: end }, active: true };
    if (arrondissement) commerceFilter.arrondissement = arrondissement;
    if (quartier) commerceFilter.quartier = quartier;
    if (marche) commerceFilter.marche = marche;
    const totalEnrolements = await Commerce.countDocuments(commerceFilter);

    const totalCollecte = collecteResult[0]?.total || 0;
    const totalImpayes = impayesResult[0]?.total || 0;
    const totalPaiements = (collecteResult[0]?.count || 0) + (impayesResult[0]?.count || 0);
    const tauxRecouvrement = totalPaiements > 0
      ? Math.round((collecteResult[0]?.count || 0) / totalPaiements * 100)
      : 0;

    res.status(200).json({
      status: 0,
      stats: {
        totalCollecte,
        totalImpayes,
        totalEnrolements,
        tauxRecouvrement,
        paiementsPayes: collecteResult[0]?.count || 0,
        paiementsEnAttente: impayesResult[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/reporting/chart
exports.getChart = async (req, res) => {
  try {
    const { period = "mois", arrondissement, quartier, marche } = req.query;
    const { start, end } = getDateRange(period);

    const matchFilter = { createdAt: { $gte: start, $lte: end }, statut: "payé" };
    if (arrondissement) matchFilter.arrondissement = arrondissement;
    if (quartier) matchFilter.quartier = quartier;
    if (marche) matchFilter.marche = marche;

    let groupBy;
    let labels = [];

    switch (period) {
      case "jour":
        groupBy = { $hour: "$createdAt" };
        labels = Array.from({ length: 12 }, (_, i) => `${8 + i}h`);
        break;
      case "semaine":
        groupBy = { $dayOfWeek: "$createdAt" };
        labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        break;
      case "mois":
        groupBy = { $isoWeek: "$createdAt" };
        labels = ["S1", "S2", "S3", "S4", "S5"];
        break;
      case "annee":
        groupBy = { $month: "$createdAt" };
        labels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
        break;
    }

    const chartData = await Paiement.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupBy,
          total: { $sum: "$montant" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      status: 0,
      labels,
      data: chartData,
      period,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/reporting/markets
exports.getMarkets = async (req, res) => {
  try {
    const { period = "mois", arrondissement, quartier } = req.query;
    const { start, end } = getDateRange(period);

    const matchFilter = { createdAt: { $gte: start, $lte: end }, statut: "payé" };
    if (arrondissement) matchFilter.arrondissement = arrondissement;
    if (quartier) matchFilter.quartier = quartier;

    const marketsData = await Paiement.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          marcheLabel: {
            $cond: {
              if: { $or: [{ $eq: ["$marche", ""] }, { $eq: ["$marche", null] }] },
              then: "Hors marché",
              else: "$marche",
            },
          },
        },
      },
      {
        $group: {
          _id: "$marcheLabel",
          montant: { $sum: "$montant" },
          count: { $sum: 1 },
        },
      },
      { $sort: { montant: -1 } },
      { $limit: 10 },
    ]);

    const markets = marketsData.map((m) => ({
      nom: m._id,
      montant: m.montant,
      count: m.count,
    }));

    res.status(200).json({ status: 0, markets });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/reporting/overview (combined endpoint)
exports.getOverview = async (req, res) => {
  try {
    const { period = "mois", arrondissement, quartier, marche } = req.query;
    const { start, end } = getDateRange(period);

    const matchFilter = { createdAt: { $gte: start, $lte: end } };
    if (arrondissement) matchFilter.arrondissement = arrondissement;
    if (quartier) matchFilter.quartier = quartier;
    if (marche) matchFilter.marche = marche;

    // Stats
    const [collecte, impayes] = await Promise.all([
      Paiement.aggregate([
        { $match: { ...matchFilter, statut: "payé" } },
        { $group: { _id: null, total: { $sum: "$montant" }, count: { $sum: 1 } } },
      ]),
      Paiement.aggregate([
        { $match: { ...matchFilter, statut: "en_attente" } },
        { $group: { _id: null, total: { $sum: "$montant" }, count: { $sum: 1 } } },
      ]),
    ]);

    const commerceFilter = { createdAt: { $gte: start, $lte: end }, active: true };
    if (arrondissement) commerceFilter.arrondissement = arrondissement;
    if (quartier) commerceFilter.quartier = quartier;
    const totalEnrolements = await Commerce.countDocuments(commerceFilter);

    const totalCollecte = collecte[0]?.total || 0;
    const paidCount = collecte[0]?.count || 0;
    const pendingCount = impayes[0]?.count || 0;
    const totalPaiements = paidCount + pendingCount;
    const tauxRecouvrement = totalPaiements > 0 ? Math.round(paidCount / totalPaiements * 100) : 0;

    // Markets ranking (including "Hors marché")
    const marketsData = await Paiement.aggregate([
      { $match: { ...matchFilter, statut: "payé" } },
      {
        $addFields: {
          marcheLabel: {
            $cond: {
              if: { $or: [{ $eq: ["$marche", ""] }, { $eq: ["$marche", null] }] },
              then: "Hors marché",
              else: "$marche",
            },
          },
        },
      },
      { $group: { _id: "$marcheLabel", montant: { $sum: "$montant" }, count: { $sum: 1 } } },
      { $sort: { montant: -1 } },
      { $limit: 5 },
    ]);

    // Recent payments
    const recentPaiements = await Paiement.find({ ...matchFilter, statut: "payé" })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 0,
      stats: {
        totalCollecte,
        totalImpayes: impayes[0]?.total || 0,
        totalEnrolements,
        tauxRecouvrement,
        paiementsPayes: paidCount,
        paiementsEnAttente: pendingCount,
      },
      markets: marketsData.map((m) => ({ nom: m._id, montant: m.montant, count: m.count })),
      recentPaiements,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
