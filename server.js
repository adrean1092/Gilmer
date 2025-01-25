const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Client } = require('twilio');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = new Client(accountSid, authToken);

// POST /send-wish route
app.post('/send-wish', async (req, res) => {
    const { wish } = req.body;

    if (!wish) {
        return res.status(400).json({ message: 'Wish content is required.' });
    }

    console.log(`Incoming wish: ${wish}`);

    try {
        // Example Twilio logic (replace with your actual number)
        await twilioClient.messages.create({
            from: 'whatsapp:+14155238886', // Twilio WhatsApp number
            to: 'whatsapp:+254727228097', // Your WhatsApp number
            body: wish,
        });

        console.log('WhatsApp notification sent!');
        res.status(200).json({ message: 'Wish sent successfully!' });
    } catch (error) {
        console.error('Failed to send WhatsApp notification:', error.message);
        res.status(500).json({ message: 'Failed to send the wish.' });
    }
});

// Default route for testing
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
