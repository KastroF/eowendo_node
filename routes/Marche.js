const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const marcheCtrl = require("../controllers/Marche");

router.post("/create", auth, marcheCtrl.create);
router.get("/all", auth, marcheCtrl.getAll);
router.put("/:id", auth, marcheCtrl.update);

module.exports = router;
