const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const User = require('../models/User');
const router = express.Router();
const Concert = require("../models/concerts");

dotenv.config(); // Load environment variables

// Generate a secure JWT Secret Key (if not set in .env)
const generateSecretKey = () => crypto.randomBytes(32).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || generateSecretKey();

// Serve the register page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});


router.get('/', async (req, res) => {
    try {
      const concerts = await Concert.find();
      const justLoggedIn = req.session.justLoggedIn || false;
      req.session.justLoggedIn = false; // reset it
  
      res.render('userpage', {
        concerts: concerts,
        username: req.session.username,
        justLoggedIn: justLoggedIn
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  

// Register User
router.post('/register', async (req, res) => { 
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        const newUser = new User({ name, email, password }); // No role field, defaults to "user"
        await newUser.save();

        res.render("login", {error : null});
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});



// Serve the login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('login', { error: "User not registered" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: "Incorrect password" });
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.username = user.name;
        req.session.justLoggedIn = true;

        if (user.role === 'admin') {
            return res.render('admin-dashboard');
        } else {
            return res.redirect('/');
        }

    } catch (error) {
        console.error("Login Error:", error);
        res.render('login', { error: "Server error" });
    }
});



// Middleware: Verify JWT Token for protected routes
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized - Missing token" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized - Invalid token" });

        req.user = decoded; // Stores user ID & role in req.user
        next();
    });
};

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


module.exports = router;
