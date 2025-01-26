
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const twilio = require("twilio");
require("dotenv").config();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = "whatsapp:+14155238886";

const app = express();

// Middleware to parse JSON
app.use(bodyParser.json());

// Serve all static files from the root directory
app.use(express.static(__dirname));

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle POST requests to /send-wish
app.post("/send-wish", async (req, res) => {
  const { wish } = req.body;

  if (!wish || typeof wish !== "string") {
    return res.status(400).json({ message: "Wish is required and must be a string." });
  }

  console.log(`Received wish: ${wish}`);

  const message = `
🎉 Birthday Wish Received! 🎉
"${wish}"

From: Adrean Cheruiyot's Website
  `;

  try {
    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const twilioResponse = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: "whatsapp:+254727228097",
    });

    console.log("Message sent successfully:", twilioResponse.sid);
    res.json({ message: "Wish sent successfully!" });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.message);
    res.status(500).json({ message: "Failed to send wish. Please try again later." });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
