const router = require("express").Router();
const { productsController } = require("../controller");
const uploadImage = require("../config/cloudinary");
router.get("/", productsController.getProducts);
router.get("/:pid", productsController.getProductById);
router.post(
  "/upload-image/:pid",
  uploadImage.single("image-product"),
  productsController.uploadImage
);
router.post("/", productsController.createProduct);
router.patch("/:pid", productsController.repairProduct);
router.delete("/:pid", productsController.deleteProduct);

module.exports = router;
