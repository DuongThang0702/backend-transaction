const slug = require("slugify");
const joi = require("joi");
const { v2: cloudinary } = require("cloudinary");

const { ProductModel } = require("../models");
const handleError = require("../middleware/handle-errors");
const {
  title,
  quantity,
  price,
  description,
} = require("../helpers/joi-schema");
const { Types } = require("mongoose");

const ProductController = {
  getProducts: async (req, res) => {
    try {
      const queries = { ...req.body };
      const excludeQuery = ["sort", "page", "limit", "fields"];
      excludeQuery.forEach((el) => delete queries[el]);

      let queryString = JSON.stringify(queries);
      queryString = queryString.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );
      const formatedQueries = JSON.parse(queryString);

      if (queries?.title)
        formatedQueries.title = { $regex: queries.title, $option: "i" };

      const queryCommad = ProductModel.find(formatedQueries);

      if (req.query?.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        queryCommad.sort(sortBy);
      }
      if (req.query?.fields) {
        const fields = req.query.fields.split(",").join(" ");
        queryCommad.select(fields);
      }

      const page = +req.query.page || 1;
      const limit = +req.query.limit || +process.env.BOOK_LIMIT;
      const skip = (page - 1) * limit;
      queryCommad.limit(limit).skip(skip);

      queryCommad
        .exec()
        .then(async (rs) => {
          const counts = await ProductModel.countDocuments();
          res.status(200).json({
            err: rs ? 0 : 1,
            counts: rs ? counts : null,
            data: rs ? rs : "Something went wrong !",
          });
        })
        .catch((err) => {
          throw new Error(err);
        });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },

  getProductById: async (req, res) => {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid))
      handleError.BadRequest("invalid product id", res);
    try {
      const response = await ProductModel.findById(pid);
      res.status(200).json({
        err: response ? 0 : 1,
        data: response ? response : "ProductId not found !",
      });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },

  createProduct: async (req, res) => {
    const { error } = joi
      .object({ title, quantity, price, description })
      .validate(req.body);
    if (error) return handleError.BadRequest(error?.details[0]?.message, res);
    try {
      const isChecked = await ProductModel.findOne({ title: req.body.title });
      if (isChecked) return handleError.BadRequest("title existed", res);
      req.body.slug = slug(req.body.title);
      const newProducts = await ProductModel.create(req.body);
      res.status(200).json({
        err: newProducts ? 0 : 1,
        Product: newProducts ? newProducts : "Somthing went wrong !",
      });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },

  repairProduct: async (req, res) => {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid))
      handleError.BadRequest("invalid product id", res);
    try {
      if (req.body && req.body.title) req.body.slug = slug(req.body.title);
      const response = await ProductModel.findByIdAndUpdate(pid, req.body, {
        new: true,
      });
      res.status(200).json({
        err: response ? 0 : 1,
        rs: response ? response : "Cannot update book",
      });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },

  deleteProduct: async (req, res) => {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid))
      handleError.BadRequest("invalid product id", res);
    try {
      const response = await ProductModel.findOneAndDelete(pid);
      cloudinary.uploader.destroy(response?.image?.filename);
      res.status(200).json({
        err: response ? 0 : 1,
        mess: response ? "Delete successfully" : "ProductId not found",
      });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },

  uploadImage: async (req, res) => {
    const { pid } = req.params;
    const file = req.file;
    if (!file) handleError.BadRequest("Missing image", res);
    if (!Types.ObjectId.isValid(pid)) {
      cloudinary.uploader.destroy(file.filename);
      return handleError.BadRequest("invalid id", res);
    }
    try {
      const { filename, path } = file;

      const response = await ProductModel.findByIdAndUpdate(
        pid,
        {
          image: { filename, path },
        },
        { new: true }
      );
      res.status(200).json({
        err: response ? 0 : 1,
        data: response ? response : "Something went wrong !",
      });
    } catch (err) {
      return handleError.InternalServerError(res);
    }
  },
};

module.exports = ProductController;
