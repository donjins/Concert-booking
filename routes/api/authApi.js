const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const User = require('../../models/User');
const Concert = require("../../models/concerts");

const secret = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZlOGM3NWU4ODc0OTA1ZjU0YzAxN2IiLCJ1c2VybmFtZSI6ImtlZXJ0aGFuYSIsImlhdCI6MTc0NDczNTM2NCwiZXhwIjoxNzQ0ODIxNzY0fQ.ieaolkB7QesxD3ZnJcEVBS0sIYmklPCr1Valg67Tve8';

const router = express.Router();
dotenv.config();

const generateSecretKey = () => crypto.randomBytes(32).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || generateSecretKey();

// Register API
router.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        const newUser = new User({ name, email, password }); // Hashing handled in model
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Login API
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign(
        { userId: user._id, username: user.name },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  ;

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized - Missing token" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized - Invalid token" });

        req.user = decoded;
        next();
    });
};

// Get all concerts (Protected API)
router.get('/api/concerts', verifyToken, async (req, res) => {
    try {
        const concerts = await Concert.find();
        res.status(200).json({ concerts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
