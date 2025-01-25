const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { Client } = require('twilio');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Twilio setup
const twilioClient = new Client(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// SQLite setup
const db = new sqlite3.Database('./wishes.db', (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS wishes (id INTEGER PRIMARY KEY AUTOINCREMENT, wish TEXT)`);

// Routes
app.get('/wishes', (req, res) => {
    db.all('SELECT * FROM wishes', [], (err, rows) => {
        if (err) {
            console.error('Error fetching wishes:', err.message);
            return res.status(500).send('Failed to fetch wishes.');
        }
        res.json(rows);
    });
});

app.post('/send-wish', async (req, res) => {
    const { wish } = req.body;
    if (!wish) {
        return res.status(400).send('Wish cannot be empty.');
    }

    // Save the wish to the database
    db.run('INSERT INTO wishes (wish) VALUES (?)', [wish], async function (err) {
        if (err) {
            console.error('Error saving wish:', err.message);
            return res.status(500).send('Failed to save the wish.');
        }

        console.log('Incoming wish:', wish);

        // Send a WhatsApp notification via Twilio
        try {
            await twilioClient.messages.create({
                from: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox number
                to: 'whatsapp:+254727228097', // Your verified WhatsApp number
                body: `New Birthday Wish: ${wish}`,
            });
            console.log('WhatsApp notification sent successfully.');
            res.status(200).send('Wish received and notification sent.');
        } catch (error) {
            console.error('Failed to send WhatsApp notification:', error.message);
            res.status(500).send('Wish received but failed to send notification.');
        }
    });
});

// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
