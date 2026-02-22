const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ status: 1, message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.CODETOKEN);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ status: 2, message: "Utilisateur introuvable" });
    }

    if (!user.active) {
      return res.status(403).json({ status: 5, message: "Compte désactivé" });
    }

    req.auth = { userId: decoded.userId, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ status: 99, message: "Authentification échouée" });
  }
};
