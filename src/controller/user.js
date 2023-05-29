const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleErrors = require("../middleware/handle-errors");
const { email, password } = require("../helpers/joi-schema");
const { UserModel } = require("../models");

const userController = {
  register: async (req, res) => {
    const { error } = joi.object({ email, password }).validate(req.body);
    if (error) return handleErrors.BadRequest(error?.details[0]?.message, res);
    try {
      const { email, password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const isChecked = await UserModel.findOne({ email });
      if (isChecked) return handleErrors.BadRequest("email existed", res);
      const newUser = new UserModel({
        email,
        password: hash,
      });
      const response = await newUser.save();
      res.status(200).json({
        err: response ? 0 : 1,
        user: response ? response : "Something went wrong",
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },

  login: async (req, res) => {
    const { error } = joi.object({ email, password }).validate(req.body);
    if (error) return handleErrors.BadRequest(error?.details[0]?.message, res);
    try {
      const response = await UserModel.findOne({ email: req.body.email });
      if (!response) return handleErrors.BadRequest("email invalid", res);
      const isChecked =
        response &&
        (await bcrypt.compare(req.body.password, response.password));
      const access_token =
        isChecked && userController.generateAccessToken(response);
      const refresh_token =
        isChecked && userController.generateRefreshToken(response);
      const { password, ...other } = response?.toObject();
      await UserModel.findByIdAndUpdate(response?._id, { refresh_token });
      res.cookie("refresh_token", refresh_token, {
        maxAge: 5 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      res.status(200).json({
        err: response ? 0 : 1,
        mess: response
          ? "Login successfullt"
          : response
          ? "Wrong password"
          : "Something went wrong",
        user: response ? other : null,
        access_token: `Bearer ${access_token}`,
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },

  logout: async (req, res) => {
    try {
      const cookie = req.cookies;
      if (!cookie && req.cookies.refresh_token)
        return handleErrors.UnAuth("No refresh token in cookies", res);
      const response = await UserModel.findOneAndUpdate(
        {
          refresh_token: req.cookies.refresh_token,
        },
        { refresh_token: "" },
        { new: true }
      );
      response &&
        res.clearCookie("refresh_token", { httpOnly: true, secure: true });
      res.status(200).json({
        err: response ? 0 : 1,
        mess: response ? "Logout successfullt" : "Something went wrong !",
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },
  refreshToken: async (req, res) => {},

  generateRefreshToken: (response) => {
    return jwt.sign({ _id: response._id }, process.env.REFRESH_TOKEN, {
      expiresIn: "5d",
    });
  },

  generateAccessToken: (response) => {
    return jwt.sign(
      {
        _id: response._id,
        email: response.email,
        role: response.role,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "30s" }
    );
  },
};

module.exports = userController;
