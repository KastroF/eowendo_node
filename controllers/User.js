const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/user/signin
exports.signin = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ status: 1, message: "Champs requis manquants" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ status: 2, message: "Identifiant ou mot de passe incorrect" });
    }

    if (!user.active) {
      return res.status(403).json({ status: 5, message: "Compte désactivé" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: 2, message: "Identifiant ou mot de passe incorrect" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.CODETOKEN, {
      expiresIn: "30d",
    });

    res.status(200).json({
      status: 0,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        userId: user.userId,
        telephone: user.telephone,
        role: user.role,
        arrondissement: user.arrondissement,
      },
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/user/create (admin only)
exports.createUser = async (req, res) => {
  try {
    const { nom, userId, password, telephone, role, arrondissement } = req.body;

    if (!nom || !userId || !password) {
      return res.status(400).json({ status: 1, message: "Nom, identifiant et mot de passe requis" });
    }

    // Check if requesting user is admin
    const requestingUser = await User.findById(req.auth.userId);
    if (requestingUser.role !== "admin") {
      return res.status(403).json({ status: 3, message: "Accès réservé aux administrateurs" });
    }

    const existing = await User.findOne({ userId });
    if (existing) {
      return res.status(409).json({ status: 4, message: "Cet identifiant existe déjà" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      nom,
      userId,
      password: hashedPassword,
      telephone: telephone || "",
      role: role || "agent",
      arrondissement: arrondissement || "",
    });

    await user.save();

    res.status(201).json({
      status: 0,
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        nom: user.nom,
        userId: user.userId,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/user/getuser
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select("-password");
    if (!user) {
      return res.status(404).json({ status: 2, message: "Utilisateur introuvable" });
    }

    res.status(200).json({
      status: 0,
      user: {
        id: user._id,
        nom: user.nom,
        userId: user.userId,
        telephone: user.telephone,
        role: user.role,
        arrondissement: user.arrondissement,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// POST /api/user/changepassword
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ status: 1, message: "Ancien et nouveau mot de passe requis" });
    }

    const user = await User.findById(req.auth.userId);
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ status: 2, message: "Ancien mot de passe incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ status: 0, message: "Mot de passe modifié avec succès" });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};

// GET /api/user/agents (admin/superviseur)
exports.getAgents = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.auth.userId);
    if (requestingUser.role === "agent") {
      return res.status(403).json({ status: 3, message: "Accès non autorisé" });
    }

    const agents = await User.find({ active: true })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 0, agents });
  } catch (err) {
    res.status(500).json({ status: 99, message: "Erreur serveur", error: err.message });
  }
};
