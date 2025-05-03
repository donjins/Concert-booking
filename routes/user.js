const express = require('express');
const router = express.Router();

router.get('/user/dashboard', (req, res) => {
    console.log("Rendering user dashboard...");

    const sampleConcerts = [
        { 
            _id: "1", 
            name: "Coldplay Live", 
            location: "Mumbai, India", 
            date: "April 15, 2025", 
            image: "https://source.unsplash.com/400x300/?concert,stage"
        },
        { 
            _id: "2", 
            name: "Ed Sheeran Tour", 
            location: "Bangalore, India", 
            date: "May 10, 2025", 
            image: "https://source.unsplash.com/400x300/?music,band"
        },
        { 
            _id: "3", 
            name: "A.R. Rahman Night", 
            location: "Chennai, India", 
            date: "June 20, 2025", 
            image: "https://source.unsplash.com/400x300/?singer,microphone"
        }
    ];

    const sampleBookings = [
        { concertName: "Coldplay Live", date: "April 15, 2025", status: "confirmed" },
        { concertName: "Ed Sheeran Tour", date: "May 10, 2025", status: "pending" },
        { concertName: "A.R. Rahman Night", date: "June 20, 2025", status: "cancelled" }
    ];

    console.log("Concerts Data:", sampleConcerts); // Debugging log
    console.log("Bookings Data:", sampleBookings);

    // Pass data to EJS template
    res.render('userpage', { concerts: sampleConcerts, bookings: sampleBookings });
});

module.exports = router;
