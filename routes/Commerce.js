const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const commerceCtrl = require("../controllers/Commerce");

router.post("/enroll", auth, commerceCtrl.enroll);
router.get("/all", auth, commerceCtrl.getAll);
router.get("/count", auth, commerceCtrl.count);
router.get("/qr/:code", auth, commerceCtrl.getByQR);
router.get("/:id", auth, commerceCtrl.getById);
router.put("/:id", auth, commerceCtrl.update);

module.exports = router;
