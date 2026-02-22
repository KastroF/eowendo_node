const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const paiementCtrl = require("../controllers/Paiement");

router.post("/create", auth, paiementCtrl.create);
router.post("/pay", auth, paiementCtrl.pay);
router.post("/confirm/:id", auth, paiementCtrl.confirm);
router.get("/pending", auth, paiementCtrl.getPending);
router.get("/history", auth, paiementCtrl.getHistory);

module.exports = router;
