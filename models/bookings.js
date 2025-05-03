const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  concertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: Number,
  price: Number,
  
});
module.exports = mongoose.model("Booking", bookingSchema);
