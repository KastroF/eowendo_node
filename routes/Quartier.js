const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const quartierCtrl = require("../controllers/Quartier");

router.post("/create", auth, quartierCtrl.create);
router.get("/all", auth, quartierCtrl.getAll);
router.put("/:id", auth, quartierCtrl.update);

module.exports = router;
