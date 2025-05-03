const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/concertbooking');

const db = mongoose.Connection;

db.on('error', console.error.bind(console,"mongodb connection error"));

db.once('open', () =>{
  console.log("MongoDb connected sucessfully")
});

module.exports = db;