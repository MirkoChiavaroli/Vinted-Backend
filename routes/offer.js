const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const User = require("../models/Users");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, size, color, brand } =
      req.fields;

    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
    });

    // Uploader photos cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: `/cassiopeia-vinted/offer/${newOffer._id}`,
    });

    newOffer.product_image = result;
    await newOffer.save();

    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    //FILTER
    let filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: Number(req.query.priceMin) };
    }
    if (req.query.priceMax) {
      filters.product_price = { $lte: Number(req.query.priceMax) };
    }
    //SORT
    let sort = {};
    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }
    //LIMIT
    let limit = Number(req.query.limit);
    let page;
    if (Number(req.query.page) > 0) {
      page = (Number(req.query.page) - 1) * limit;
    } else {
      page = 0;
    }

    const result = await Offer.find(filters)
      .sort(sort)
      .populate("owner", "account")
      .skip(page)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//MODIFY OFFER
router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  const offerToModify = await Offer.findById(req.params.id);
  try {
    if (req.fields.title) {
      offerToModify.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToModify.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToModify.product_price = req.fields.price;
    }

    const details = offerToModify.product_details;
    for (i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (req.fields.brand) {
          details[i].MARQUE = req.fields.brand;
        }
      }
      if (details[i].TAILLE) {
        if (req.fields.size) {
          details[i].TAILLE = req.fields.size;
        }
      }
      if (details[i].ÉTAT) {
        if (req.fields.condition) {
          details[i].ÉTAT = req.fields.condition;
        }
      }
      if (details[i].COULEUR) {
        if (req.fields.color) {
          details[i].COULEUR = req.fields.color;
        }
      }
      if (details[i].EMPLACEMENT) {
        if (req.fields.location) {
          details[i].EMPLACEMENT = req.fields.location;
        }
      }
    }

    offerToModify.markModified("product_details");

    if (req.files.picture) {
      const result = await cloudinary.uploader.upload(req.files.picture.path, {
        public_id: `api/vinted/offers/${offerToModify._id}/preview`,
      });
      offerToModify.product_image = result;
    }

    await offerToModify.save();

    res.status(200).json("Offer modified succesfully !");
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

//DELETE OFFER
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted/offers/${req.params.id}`
    );
    await cloudinary.api.delete_folder(`api/vinted/offers/${req.params.id}`);

    offerToDelete = await Offer.findById(req.params.id);

    await offerToDelete.delete();

    res.status(200).json("Offer deleted succesfully !");
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
