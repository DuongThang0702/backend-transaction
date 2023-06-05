const joi = require("joi");

//user
const password = joi.string().min(6).required();
const email = joi.string().pattern(new RegExp("gmail.com")).required();
const refreshToken = joi.string().required();
const first_name = joi.string().required();
const last_name = joi.string().required();

//products
const title = joi.string().required();
const quantity = joi.number().required();
const price = joi.number().required();
const description = joi.string();

module.exports = {
  email,
  password,
  refreshToken,
  first_name,
  last_name,
  title,
  quantity,
  price,
  description,
};
