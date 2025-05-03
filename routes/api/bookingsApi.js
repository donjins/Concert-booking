const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Concert = require('../../models/concerts');
const Booking = require('../../models/bookings');
const User = require('../../models/User');
const isAuthenticated = require('../../middlewares/auth');

// GET concert details before booking
router.get('/api/bookings/concert/:id', isAuthenticated, async (req, res) => {
  const concertId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(concertId)) {
    return res.status(400).json({ message: 'Invalid concert ID' });
  }

  try {
    const concert = await Concert.findById(concertId);
    if (!concert) return res.status(404).json({ message: 'Concert not found' });

    res.json({ concert, username: req.user.username });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST payment summary
router.post('/api/bookings/payment/:id', isAuthenticated, async (req, res) => {
  const concertId = req.params.id;
  const quantity = parseInt(req.body.quantity);
  const totalPrice = parseFloat(req.body.totalPrice);

  try {
    const concert = await Concert.findById(concertId);
    if (!concert) return res.status(404).json({ message: 'Concert not found' });

    res.json({ concert, quantity, totalPrice });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST create booking
router.post('/api/bookings/:id', isAuthenticated, async (req, res) => {
  const concertID = req.params.id;
  const quantity = Number(req.body.quantity);
  const totalPrice = Number(req.body.totalPrice);
  const userId = req.user.userId;

  if (isNaN(quantity) || isNaN(totalPrice)) {
    return res.status(400).json({ message: 'Invalid booking data' });
  }

  try {
    const booking = new Booking({
      concertId: concertID,
      userId,
      quantity,
      price: totalPrice
    });

    await booking.save();
    res.json({ message: 'Booking successful', bookingId: booking._id });
  } catch (err) {
    res.status(500).json({ message: 'Error saving booking' });
  }
});

// GET ticket info by booking ID
router.get('/api/bookings/ticket/:bookingId', async (req, res) => {
  try {
    console.log('Booking ID:', req.params.bookingId);

    const booking = await Booking.findById(req.params.bookingId);
    console.log('Booking:', booking);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const concert = await Concert.findById(booking.concertId);
    console.log('Concert:', concert);
    const user = await User.findById(booking.userId);
    console.log('User:', user);

    if (!concert || !user) return res.status(404).json({ message: 'Concert or User not found' });

    res.json({
      concert: {
        name: concert.name,
        date: concert.date,
        time: concert.time,
        venue: concert.venue,
      },
      user: {
        name: user.name,
      },
      quantity: booking.quantity,
      totalPrice: booking.price,
      bookingId: booking._id.toString(),
    });
  } catch (err) {
    console.error('Error:', err); // Log full error
    res.status(500).json({ message: 'Server Error' });
  }
});


// GET user's own bookings
router.get('/api/bookings/my', isAuthenticated, async (req, res) => {
  const userId = req.user.userId;

  try {
    const bookings = await Booking.find({ userId });

    const bookingData = await Promise.all(bookings.map(async (booking) => {
      const concert = await Concert.findById(booking.concertId);
      return {
        _id: booking._id,
        concertName: concert?.name || 'Unknown',
        date: concert?.date,
        time: concert?.time,
        venue: concert?.venue,
        quantity: booking.quantity,
        price: booking.price,
      };
    }));

    res.json({ bookings: bookingData });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin: GET all bookings
router.get('/api/bookings/admin/all', async (req, res) => {
  try {
    const bookings = await Booking.find().lean();

    const updatedBookings = await Promise.all(bookings.map(async (booking) => {
      const user = await User.findById(booking.userId).lean();
      const concert = await Concert.findById(booking.concertId).lean();

      return {
        ...booking,
        userName: user?.name || 'Unknown',
        concertName: concert?.name || 'Unknown',
      };
    }));

    res.json({ bookings: updatedBookings });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
