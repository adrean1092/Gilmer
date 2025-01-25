require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const twilio = require("twilio");
const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const twilioWhatsAppNumber = "whatsapp:+14155238886"; // Twilio Sandbox
const personalWhatsAppNumber = "whatsapp:+254727228097"; // Your WhatsApp number

// SQLite setup
const db = new sqlite3.Database("./wishes.db", (err) => {
    if (err) console.error("Database connection error:", err.message);
    console.log("Connected to SQLite database.");
});

// Create wishes table
db.run(`
    CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// API endpoint to handle wish submissions
app.post("/send-wish", (req, res) => {
    const { wish } = req.body;

    console.log("Incoming wish:", wish); // Log the incoming wish

    if (!wish) {
        console.error("No wish content provided.");
        return res.status(400).send("Wish content is required.");
    }

    const query = `INSERT INTO wishes (content) VALUES (?)`;
    db.run(query, [wish], function (err) {
        if (err) {
            console.error("Failed to save wish in the database:", err.message); // Log database error
            return res.status(500).send("Failed to save wish.");
        }

        console.log("Wish saved in the database."); // Log successful save

        // Send WhatsApp notification
        client.messages
            .create({
                from: twilioWhatsAppNumber,
                to: personalWhatsAppNumber,
                body: `🎉 New Birthday Wish 🎉\n\n"${wish}"`,
            })
            .then(() => {
                console.log("WhatsApp notification sent successfully."); // Log successful WhatsApp
                res.status(200).send("Wish saved and WhatsApp notification sent!");
            })
            .catch((err) => {
                console.error("Failed to send WhatsApp notification:", err.message); // Log Twilio error
                res.status(500).send("Wish saved, but WhatsApp notification failed.");
            });
    });
});

// API endpoint to get all wishes
app.get("/wishes", (req, res) => {
    const query = `SELECT * FROM wishes ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Failed to fetch wishes:", err.message); // Log database fetch error
            return res.status(500).send("Failed to fetch wishes.");
        }
        res.json(rows);
    });
});

// Default route to handle requests to "/"
app.get("/", (req, res) => {
    res.send("Welcome to the Birthday Wishes App! Use /wishes to view wishes or /send-wish to submit a wish.");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
