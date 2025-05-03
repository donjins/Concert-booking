const express = require("express");
const router = express.Router();
const path = require("path");
const Concert = require("../models/concerts");
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


router.get("/", async (req, res) => {
  try {
    const concerts = await Concert.find();
    res.render("concerts", { concerts , username: req.session.username });
  } catch (error) {
    console.error("Error fetching concerts:", error);
    res.status(500).send("Error loading concerts");
  }
});

// Add concert form page
router.get("/add", async (req, res) => {
  res.render("add-concert");
});

// Handle concert creation
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
      languages: Array.isArray(languages) ? languages : languages.split(',').map(lang => lang.trim()),
      genres: Array.isArray(genres) ? genres : genres.split(',').map(genre => genre.trim()),
      image
    });

    await newConcert.save();
    res.redirect("/concerts");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding concert");
  }
});




// ✅ Edit concert route (fix applied here)
router.get("/edit/:id", async (req, res) => {
  try {
    const concert = await Concert.findById(req.params.id);
    if (!concert) {
      return res.status(404).send("Concert not found");
    }
    res.render("edit-concert", { concert });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, date, time, venue, seats, price, description, duration, languages, genres } = req.body;
    const concert = await Concert.findById(req.params.id);

    if (!concert) {
      return res.status(404).send("Concert not found");
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
    res.redirect("/concerts");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating concert");
  }
});

router.post('/delete/:id', async (req, res) => {
  console.log('Deleting concert:', req.params.id);

  try {
    await Concert.findByIdAndDelete(req.params.id);
    res.redirect('/concerts');
  } catch (err) {
    console.error('Error deleting concert:', err);
    res.status(500).send("Server Error");
  }
});



router.get('/admin-dashboard' , (req , res) => {
  res.render('admin-dashboard')
})


module.exports = router;

