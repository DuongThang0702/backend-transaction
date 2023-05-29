const jwt = require("jsonwebtoken");
const handleErrors = require("../middleware/handle-errors");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) return handleErrors.BadRequest("Require authorization", res);
    const access_token = token?.split(" ")[1];
    jwt.verify(access_token, process.env.ACCESS_TOKEN, (err, user) => {
      if (err) {
        const isChecked = err instanceof jwt.TokenExpiredError;
        if (isChecked)
          return handleErrors.UnAuth("Token expired", res, isChecked);
        if (!isChecked)
          return handleErrors.UnAuth("invalid token", res, isChecked);
      }
      req.user = user;
      next();
    });
  } catch (err) {
    return handleErrors.InternalServerError(res);
  }
};

module.exports = verifyToken;
