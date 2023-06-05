const User = require("./user");
const Product = require("./product");
const handleErrors = require("../middleware/handle-errors");
const initRoutes = (app) => {
  app.use("/api/v1/user", User);
  app.use("/api/v1/product", Product);
  app.use(handleErrors.NotFound);
};

module.exports = initRoutes;
