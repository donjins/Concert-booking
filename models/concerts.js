const mongoose = require('mongoose');

const ConcertSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  languages: { type: [String], default: [] },
  genres: { type: [String], default: [] },
  venue: { type: String, required: true },
  seats: { type: Number, required: true },
  availableSeats: { type: Number }, // to be set initially equal to seats
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String }
});

// Set availableSeats = seats if not already set
ConcertSchema.pre('save', function (next) {
  if (this.isNew && (this.availableSeats === undefined || this.availableSeats === null)) {
    this.availableSeats = this.seats;
  }
  next();
});

module.exports = mongoose.model('Concert', ConcertSchema);
