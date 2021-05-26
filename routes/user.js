const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/Users");
const Offer = require("../models/Offer");

// SIGN UP
router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    const { avatar } = req.files;
    const user = await User.findOne({ email: email });
    if (!user) {
      if (username && password) {
        const salt = uid2(16);
        const token = uid2(64);
        const hash = SHA256(salt + password).toString(encBase64);

        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
          },
          token: token,
          salt: salt,
          hash: hash,
        });

        const avatarUser = await cloudinary.uploader.upload(
          req.files.avatar.path,
          {
            folder: `/vinted/user/avatar/`,
          }
        );

        newUser.avatar = avatarUser;

        await newUser.save();

        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(400).json({ message: "Missimg parameters" });
      }
    } else {
      res.status(409).json({ message: "This email already existe" }); //se gia esiste un user
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    const user = await User.findOne({ email: email });
    if (user) {
      const newHash = SHA256(user.salt + password).toString(encBase64);
      if (newHash === user.hash) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401), json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ message: "Unauthorized" });
  }
});

module.exports = router;
