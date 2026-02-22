const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userCtrl = require("../controllers/User");

router.post("/signin", userCtrl.signin);
router.post("/create", auth, userCtrl.createUser);
router.get("/getuser", auth, userCtrl.getUser);
router.post("/changepassword", auth, userCtrl.changePassword);
router.get("/agents", auth, userCtrl.getAgents);

module.exports = router;
