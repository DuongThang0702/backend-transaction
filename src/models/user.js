const { Schema, model, Types } = require("mongoose");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      min: 6,
      require: true,
    },
    cart: [
      {
        product: { type: Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 0 },
      },
    ],
    role: { type: String, default: "user" },
    refresh_token: { type: String },
    first_name: String,
    last_name: String,
  },
  { timestamps: true }
);

const userModel = model("User", UserSchema);
module.exports = userModel;
