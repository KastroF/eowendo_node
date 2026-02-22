const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const reportingCtrl = require("../controllers/Reporting");

router.get("/stats", auth, reportingCtrl.getStats);
router.get("/chart", auth, reportingCtrl.getChart);
router.get("/markets", auth, reportingCtrl.getMarkets);
router.get("/overview", auth, reportingCtrl.getOverview);

module.exports = router;
