const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleErrors = require("../middleware/handle-errors");
const { email, password } = require("../helpers/joi-schema");
const { UserModel } = require("../models");

const UserController = {
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
      const user = await UserModel.findOne({ email: req.body.email });
      if (!user) return handleErrors.BadRequest("email invalid", res);
      const isChecked =
        user && (await bcrypt.compare(req.body.password, user.password));
      const access_token =
        isChecked && UserController.generateAccessToken(user);
      const refresh_token =
        isChecked && UserController.generateRefreshToken(user);
      //update refresh token
      const response = await UserModel.findByIdAndUpdate(
        user?._id,
        { refresh_token },
        { new: true }
      );
      const { password, ...userData } = response?.toObject();
      //give refresh token to cookie
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        maxAge: 5 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        err: access_token ? 0 : 1,
        mess: access_token
          ? "Login successfullt"
          : response
          ? "Wrong password"
          : "Something went wrong",
        user: access_token ? userData : null,
        access_token: access_token ? `Bearer ${access_token}` : null,
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },

  logout: async (req, res) => {
    if (!req.cookies && !req.cookies.refresh_token)
      return handleErrors.UnAuth("No refresh token in cookies", res);
    try {
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
        mess: response ? "Logout successfullt" : "No refresh token in cookies",
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },
  refreshToken: async (req, res) => {
    const cookie = req.cookies;
    if (!cookie && !cookie.refresh_token)
      return handleErrors.BadRequest("No refresh token in cookies", res);
    try {
      jwt.verify(
        cookie.refresh_token,
        process.env.REFRESH_TOKEN,
        async (err, decode) => {
          if (err) return handleErrors.BadRequest("invalid refresh token", res);
          const response = await UserModel.find({
            _id: decode._id,
            refresh_token: cookie.refreshToken,
          });
          res.status(200).json({
            err: response ? 0 : 1,
            new_access_token: response
              ? `Bearer ${UserController.generateAccessToken(response)}`
              : "Refresh token not matched",
          });
        }
      );
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },

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

  getCurrent: async (req, res) => {
    try {
      const { _id } = req?.user;
      const response = await UserModel.findById(_id).select(
        "-refresh_token -password -role"
      );
      res.status(200).json({
        err: response ? 0 : 1,
        user_data: response ? response : "invalid User id",
      });
    } catch (err) {
      return handleErrors.InternalServerError(res);
    }
  },
};

module.exports = UserController;
