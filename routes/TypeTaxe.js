const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const typeTaxeCtrl = require("../controllers/TypeTaxe");

router.post("/create", auth, typeTaxeCtrl.create);
router.get("/all", auth, typeTaxeCtrl.getAll);
router.put("/:id", auth, typeTaxeCtrl.update);

module.exports = router;
