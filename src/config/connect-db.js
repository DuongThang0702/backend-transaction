const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(process.env.URI_MONGOOSE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((rs) => console.log("Connected mongodb"))
    .catch((err) => console.log("Unable DB ", err));
};

module.exports = connectDB;
