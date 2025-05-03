const express = require("express");
const router = express.Router();
const path = require("path");
const Concert = require("../../models/concerts");
const multer = require("multer");

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// 📦 GET all concerts
router.get("/", async (req, res) => {
  try {
    const concerts = await Concert.find();
    res.json({ concerts });
  } catch (error) {
    console.error("Error fetching concerts:", error);
    res.status(500).json({ message: "Error loading concerts" });
  }
});


// ➕ Add a new concert
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, date, time, venue, seats, price, description, duration, languages, genres } = req.body;
    const image = req.file ? req.file.filename : null;

    const newConcert = new Concert({
      name,
      date,
      time,
      venue,
      seats: parseInt(seats),
      price: parseFloat(price),
      description,
      duration: parseFloat(duration),
      languages: typeof languages === 'string' ? languages.split(',').map(l => l.trim()) : Array.isArray(languages) ? languages : [],
      genres: typeof genres === 'string' ? genres.split(',').map(g => g.trim()) : Array.isArray(genres) ? genres : [],
      image
    });

    await newConcert.save();
    res.status(201).json({ message: "Concert added successfully", concert: newConcert });
  } catch (error) {
    console.error("❌ Error adding concert:", error);
    res.status(500).json({ message: "Error adding concert" });
  }
});



// 📝 Edit concert (GET single concert)
router.get("/:id", async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }
    res.json({ concert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🛠️ Edit concert (UPDATE)
router.put("/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, date, time, venue, seats, price, description, duration, languages, genres } = req.body;
    const concert = await Concert.findById(req.params.id);

    if (!concert) {
      return res.status(404).json({ message: "Concert not found" });
    }

    concert.name = name;
    concert.date = date;
    concert.time = time;
    concert.venue = venue;
    concert.seats = parseInt(seats);
    concert.price = parseFloat(price);
    concert.description = description;
    concert.duration = parseFloat(duration);
    concert.languages = Array.isArray(languages) ? languages : languages.split(',').map(lang => lang.trim());
    concert.genres = Array.isArray(genres) ? genres : genres.split(',').map(genre => genre.trim());

    if (req.file) {
      concert.image = req.file.filename;
    }

    await concert.save();
    res.json({ message: "Concert updated", concert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating concert" });
  }
});

// 🗑️ Delete concert
router.delete("/delete/:id", async (req, res) => {
  try {
    await Concert.findByIdAndDelete(req.params.id);
    res.json({ message: "Concert deleted" });
  } catch (error) {
    console.error("Error deleting concert:", error);
    res.status(500).json({ message: "Error deleting concert" });
  }
});

module.exports = router;
