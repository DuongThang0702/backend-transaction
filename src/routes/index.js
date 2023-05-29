const User = require("./user");
const handleErrors = require("../middleware/handle-errors");
const initRoutes = (app) => {
  app.use("/api/v1/user", User);
  app.use(handleErrors.NotFound);
};

module.exports = initRoutes;
