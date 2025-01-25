const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { Twilio } = require('twilio'); // Correct way to import Twilio

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON requests
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./wishes.db', (err) => {
  if (err) {
    console.error('Failed to connect to the database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT
      )
    `);
  }
});

// Initialize Twilio client
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Endpoint to receive and save wishes
app.post('/send-wish', (req, res) => {
  const { wish } = req.body;

  if (!wish) {
    return res.status(400).json({ error: 'Wish message is required.' });
  }

  // Save wish to the database
  db.run('INSERT INTO wishes (message) VALUES (?)', [wish], function (err) {
    if (err) {
      console.error('Failed to save wish:', err.message);
      return res.status(500).json({ error: 'Failed to save the wish.' });
    }

    console.log('Wish saved in the database.');

    // Send a WhatsApp notification via Twilio
    client.messages
      .create({
        body: `New Birthday Wish: ${wish}`,
        from: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox number
        to: 'whatsapp:+254727228097' // Replace with your WhatsApp number
      })
      .then((message) => {
        console.log('WhatsApp notification sent:', message.sid);
        res.json({ message: 'Wish sent and saved successfully!' });
      })
      .catch((error) => {
        console.error('Failed to send WhatsApp notification:', error.message);
        res.status(500).json({ error: 'Failed to send WhatsApp notification.' });
      });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
