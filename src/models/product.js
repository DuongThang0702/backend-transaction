const { Schema, model, Types } = require("mongoose");

const ProductSchema = new Schema(
  {
    title: { type: String, require: true, unique: true },
    slug: { type: String },
    image: { filename: String, path: String },
    quantity: { type: Number, require: true, default: 0 },
    price: { type: Number, require: true },
    description: { type: String },
  },
  { timestamps: true }
);

const ProductModel = model("Product", ProductSchema);
module.exports = ProductModel;
