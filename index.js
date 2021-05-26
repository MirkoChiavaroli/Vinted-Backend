require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const morgan = require("morgan");
const cors = require("cors");

const app = express();
app.use(formidable());
app.use(cors());
app.use(morgan("dev"));
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/vinted", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// config Cloudi > .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_PIC_cloud_name,
  api_key: process.env.CLOUDINARY_PIC_api_key,
  api_secret: process.env.CLOUDINARY_PIC_api_secret,
});

// import des routes
const user = require("./routes/user");
app.use(user);
const offer = require("./routes/offer");
app.use(offer);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welkome to Vinted API" });
});

app.all("*", (req, res) => {
  res.status(404).json({ error: "This route dosn't existe" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});

// process.env.PORT
