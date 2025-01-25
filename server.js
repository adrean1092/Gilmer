const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio configuration
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Database setup
const db = new sqlite3.Database("wishes.db", (err) => {
  if (err) console.error("Error connecting to database:", err);
  else console.log("Connected to SQLite database.");
});

// Create wishes table if not exists
db.run(
  `CREATE TABLE IF NOT EXISTS wishes (id INTEGER PRIMARY KEY, wish TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
);

// Route to serve the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Ensure your `index.html` is in the `public` folder
});

// Route to handle sending wishes
app.post("/send-wish", (req, res) => {
  const { wish } = req.body;
  if (!wish) return res.status(400).send({ error: "Wish cannot be empty." });

  console.log("Incoming wish:", wish);

  // Save wish to database
  db.run("INSERT INTO wishes (wish) VALUES (?)", [wish], function (err) {
    if (err) {
      console.error("Error saving wish:", err);
      return res.status(500).send({ error: "Failed to save wish." });
    }

    console.log("Wish saved in the database.");

    // Send Twilio message
    client.messages
      .create({
        from: "whatsapp:+14155238886", // Twilio Sandbox number
        to: "whatsapp:+254727228097", // Your WhatsApp number
        body: `🎉 New Birthday Wish: "${wish}"`,
      })
      .then((message) => {
        console.log("WhatsApp message sent:", message.sid);
        res.send({ message: "Wish sent and saved successfully!" });
      })
      .catch((error) => {
        console.error("Failed to send WhatsApp notification:", error.message);
        res.status(500).send({
          error: "Wish saved, but failed to send WhatsApp notification.",
        });
      });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
