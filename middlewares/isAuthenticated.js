//importo model User.. Offer no perchè non mi serve per autentificare la mail. al 99% posso riutilizzare questo form per tutti i server
const User = require("../models/Users");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      //cerca user dans BDD
      //trovare il token in BDD
      const token = req.headers.authorization.replace("Bearer ", "");
      //   console.log(token);
      const user = await User.findOne({ token: token }).select("account _id");
      if (user) {
        //va a prendere info in Offre e in User.js
        req.user = user;
        //se lo trova passa alla funzione in offer.js
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
