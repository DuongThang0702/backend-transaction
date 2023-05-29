const router = require("express").Router();
const { userController } = require("../controller");
const verifyToken = require("../middleware/verify-token");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/refresh-token", userController.refreshToken);
router.delete("/logout", userController.logout);
router.get("/current", verifyToken, userController.getCurrent);

module.exports = router;
