// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // To read environment variables from .env

const app = express();
const port = 3000;

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID from .env
const authToken = process.env.TWILIO_AUTH_TOKEN;   // Twilio Auth Token from .env
const client = require('twilio')(accountSid, authToken);
const twilioFromNumber = '+14155238886'; // Twilio-provided WhatsApp number
const yourWhatsAppNumber = 'whatsapp:+254727228097'; // Your WhatsApp number

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database('./wishes.db', (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS wishes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                message TEXT NOT NULL
            )
        `, (err) => {
            if (err) console.error('Error creating table:', err.message);
        });
    }
});

// Route: Test server
app.get('/', (req, res) => {
    res.send('Welcome to the Birthday Wishes App! Use /wishes to view wishes or /send-wish to submit a wish.');
});

// Route: Fetch all wishes
app.get('/wishes', (req, res) => {
    db.all('SELECT * FROM wishes', [], (err, rows) => {
        if (err) {
            console.error('Error fetching wishes:', err.message);
            res.status(500).json({ error: 'Failed to fetch wishes' });
        } else {
            res.json(rows);
        }
    });
});

// Route: Add a new wish
app.post('/send-wish', (req, res) => {
    const { name, message } = req.body;

    if (!name || !message) {
        return res.status(400).json({ error: 'Name and message are required' });
    }

    // Insert the wish into the database
    const sql = 'INSERT INTO wishes (name, message) VALUES (?, ?)';
    db.run(sql, [name, message], function (err) {
        if (err) {
            console.error('Error saving wish:', err.message);
            res.status(500).json({ error: 'Failed to save wish' });
        } else {
            console.log('Wish saved in the database.');

            // Send WhatsApp notification using Twilio
            client.messages
                .create({
                    from: twilioFromNumber,
                    to: yourWhatsAppNumber,
                    body: `New Birthday Wish!\n\nFrom: ${name}\nMessage: ${message}`,
                })
                .then((message) => {
                    console.log(`WhatsApp notification sent. SID: ${message.sid}`);
                    res.status(200).json({ success: 'Wish saved and notification sent!' });
                })
                .catch((error) => {
                    console.error('Failed to send WhatsApp notification:', error.message);
                    res.status(500).json({ error: 'Wish saved, but failed to send notification' });
                });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
