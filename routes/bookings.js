const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Concert = require('../models/concerts');
const Booking = require('../models/bookings');
const User = require('../models/User');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');



// Email sending logic using Mailtrap
const sendTicketEmail = (email, bookingId, concert, user, totalPrice) => {
  // Looking to send emails in production? Check out our Email API/SMTP product!
var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "cb26509b9ac09f",
    pass: "5a27bae395b8ac"
  }
});

  // HTML content for the email
  const htmlContent = `
    <h1>Your Concert Ticket</h1>
    <p>Enjoy the show!</p>
    <p>Your booking ID is <strong>${bookingId}</strong></p>
    <p>Concert: ${concert.name}</p>
    <p>Date: ${concert.date} at ${concert.time}</p>
    <p>Venue: ${concert.venue}</p>
    <p>Ticket Holder: ${user.name}</p>
    <p>Quantity: 1</p>
    <p>Total Price: ₹${totalPrice.toFixed(2)}</p>
  `;

  // Generate the PDF
  const pdfDocument = require('html-pdf');
  const ticketHtml = `
    <div style="font-family: 'Segoe UI', sans-serif; background: #fff; padding: 20px; border-radius: 10px;">
      <h2>Concert Ticket</h2>
      <p>Booking ID: ${bookingId}</p>
      <p>Concert: ${concert.name}</p>
      <p>Date: ${concert.date} at ${concert.time}</p>
      <p>Venue: ${concert.venue}</p>
      <p>Ticket Holder: ${user.name}</p>
      <p>Price: ₹${totalPrice.toFixed(2)}</p>
    </div>
  `;
  
  // Create the PDF buffer
  pdfDocument.create(ticketHtml, { format: 'A4' }).toBuffer((err, buffer) => {
    if (err) {
      console.error('Error generating PDF:', err);
    } else {
      const mailOptions = {
        from: '"Concert Booking" <booking@concerts.com>',  // Sender address
        to: email,  // Recipient's email address
        subject: 'Your Concert Ticket',  // Subject line
        text: 'Here is your concert ticket. Enjoy the show!',  // Plain text body
        html: htmlContent,  // HTML body
        attachments: [{
          filename: `Ticket-${bookingId}.pdf`,
          content: buffer,
          encoding: 'base64'
        }]  // Attaching the PDF file
      };

      // Send email with PDF attachment
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error occurred:', error);
        } else {
          console.log('Ticket sent:', info.messageId);
        }
      });
    }
  });
};





function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Route to display a concert by its ID
router.get('/book/:id', isAuthenticated, async (req, res) => {
  const concertId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(concertId)) {
    return res.status(400).send("Invalid concert ID");
  }

  try {
    const concert = await Concert.findById(concertId);

    if (!concert) {
      return res.status(404).send("Concert not found");
    }

    res.render('concertpage', { concert, username: req.session.username });
  } catch (err) {
    console.error("Error fetching concert:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Payment preview page
router.post('/payment/:id', isAuthenticated, async (req, res) => {
  const concertId = req.params.id;
  const quantity = parseInt(req.body.quantity);
  const totalPrice = parseFloat(req.body.totalPrice);

  try {
    const concert = await Concert.findById(concertId);
    if (!concert) {
      return res.status(404).send("Concert not found");
    }

    res.render('bookConcert', {
      concert,
      quantity,
      totalPrice
    });
  } catch (err) {
    console.error("Error in POST /payment/:id", err);
    res.status(500).send("Server Error");
  }
});

// Booking a concert
router.post('/booking/:id', isAuthenticated, async (req, res) => {
  const concertID = req.params.id;
  const quantity = Number(req.body.quantity);
  const totalPrice = Number(req.body.totalPrice);
  const userId = req.session.userId;

  if (isNaN(quantity) || isNaN(totalPrice) || !userId) {
    return res.status(400).send("Invalid booking data ❌");
  }

  try {
    const concert = await Concert.findById(concertID);

    if (!concert) {
      return res.status(404).send("Concert not found ❌");
    }

    if (concert.availableSeats < quantity) {
      return res.status(400).send("Not enough seats available ❌");
    }

    concert.availableSeats -= quantity;
    await concert.save();

    const booking = new Booking({
      concertId: concertID,
      userId: userId,
      quantity: quantity,
      price: totalPrice
    });

    await booking.save();

    res.redirect(`/bookings/ticket/${booking._id}`);
  } catch (err) {
    console.error("Error saving booking:", err);
    res.status(500).send("Error saving booking ❌");
  }
});

// Ticket display
router.get('/ticket/:bookingId', async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).send("Booking not found ❌");

  const concert = await Concert.findById(booking.concertId);
  const user = await User.findById(booking.userId);

  if (!concert || !user) return res.status(404).send("Concert or User not found ❌");

  // Send ticket email with PDF attachment
  sendTicketEmail(user.email, booking._id, concert, user, booking.price);

  // Render the ticket on the page as well
  res.render('ticket', {
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
});


// User's personal bookings
router.get('/myBookings', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  const bookings = await Booking.find({ userId });

  if (!bookings.length) {
    return res.status(404).send("No bookings found ❌");
  }

  const bookingData = [];

  for (const booking of bookings) {
    const concert = await Concert.findById(booking.concertId);
    if (concert) {
      bookingData.push({
        _id: booking._id,
        concertName: concert.name,
        date: concert.date,
        time: concert.time,
        venue: concert.venue,
        quantity: booking.quantity,
        price: booking.price
      });
    }
  }

  const user = await User.findById(userId);

  res.render('bookings', {
    bookings: bookingData,
    user: { name: user.name }
  });
});

// Admin bookings page
router.get('/adminbookings', async (req, res) => {
  try {
    const bookings = await Booking.find().lean();

    const updatedBookings = await Promise.all(bookings.map(async (booking) => {
      const user = await User.findById(booking.userId).lean();
      const concert = await Concert.findById(booking.concertId).lean();

      return {
        ...booking,
        userName: user ? user.name : 'Unknown',
        concertName: concert ? concert.name : 'Unknown',
      };
    }));

    res.render('adminbooking', { bookings: updatedBookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/ticket', async (req, res) => {
  const bookingId = req.query.bookingId || 'ABC123456';
  
  const qrBase64 = await QRCode.toDataURL(bookingId, {
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 200
  });

  res.render('ticket', { bookingId, qrBase64 });
});

module.exports = router;
