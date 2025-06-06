const express = require('express');
const bodyParser = require('body-parser');
const sharp = require('sharp');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('tickets'));

const backgroundPath = path.join(__dirname, 'backgroundimageconcordnirvanablurry.png');
const ticketsDir = path.join(__dirname, 'tickets');
if (!fs.existsSync(ticketsDir)) {
  fs.mkdirSync(ticketsDir);
}

// Serve the form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to generate the ticket
app.post('/generate-ticket', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const ticketId = `NIRVANA-${Math.floor(100000 + Math.random() * 9000000)}`;
  const ticketPath = path.join(ticketsDir, `${ticketId}.png`);

  try {
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(ticketId, { width: 100 });

    // SVG overlay with event details and QR code
    const svgOverlay = `
<svg width="550" height="1000" viewBox="0 0 550 1000" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title {
      font-family: Candara, Arial, sans-serif;
      font-size: 28px;
      font-weight: 600;
      fill: #BCA37F;
      text-anchor: middle;
    }
    .ticket-number {
      font-family: Candara, Arial, sans-serif;
      font-size: 36px;
      font-weight: 600;
      fill:rgb(0, 0, 0); /* Updated ticket number color */
      text-anchor: middle;
    }
    .info {
      font-family: Candara, Arial, sans-serif;
      font-size: 24px;
      font-weight: 600;
      fill: #BCA37F;
      text-anchor: middle;
    }
    .details {
      font-family: Candara, Arial, sans-serif;
      font-size: 22px;
      font-weight: 600;
      fill:rgb(0, 0, 0);
      text-anchor: middle;
    }
    .more-info {
      font-family: Candara, Arial, sans-serif;
      font-size: 20px;
      fill:rgb(53, 53, 53);
      text-anchor: middle;
    }
    .line {
      stroke:rgb(53, 53, 53);
      stroke-width: 0.5;
    }
  </style>
  <!-- Perforation with semi-circles at the center edges -->
  <circle cx="0" cy="500" r="12" fill="#000000" />  <!-- Left side perforation -->
  <circle cx="550" cy="500" r="12" fill="#000000" /> <!-- Right side perforation -->
  <!-- QR Code Section -->
  <g class="qr-container">
    <rect x="150" y="40" width="250" height="250" fill="rgba(255, 255, 255, 0.1)" />
    <image href="data:image/png;base64,${qrCodeBuffer.toString('base64')}" x="150" y="40" width="250" height="250" />
  </g>
  <!-- Ticket Number Section -->
  <text x="50%" y="340" class="ticket-number">Ticket Number:</text>
  <text x="50%" y="380" class="ticket-number">${ticketId}</text>
  <!-- Separator between Ticket Number and Attendee -->
  <line x1="40" y1="420" x2="510" y2="420" class="line"/>
  <!-- Attendee Section -->
  <text x="50%" y="460" class="info">Attendee:</text>
  <text x="50%" y="500" class="details">${name}</text>
  <!-- Separator line between Attendee and Event Details -->
  <line x1="40" y1="540" x2="510" y2="540" class="line"/>
  <!-- Event title and details -->
  <text x="50%" y="580" class="title">Event: NIRVANA</text>
  <text x="50%" y="620" class="details">Venue: The Concord Hotel</text>
  <text x="50%" y="660" class="details" fill="#FEFAF6">Sat 29th March</text>
  <text x="50%" y="700" class="details" fill="#FEFAF6">1500hrs</text>
  <!-- Separator above More Info Section -->
  <line x1="40" y1="740" x2="510" y2="740" class="line"/>
  <!-- More-info Section Centered -->
  <text x="50%" y="780" class="more-info">🎶 Dive Into Nirvana: A Night of House Music Bliss! 🌌</text>
  <text x="50%" y="820" class="more-info">Get ready to experience the ultimate house party at Nirvana!</text>
  <text x="50%" y="860" class="more-info">Join us for an unforgettable night filled with pulsating beats,</text>
  <text x="50%" y="900" class="more-info">electric energy, and a vibrant community of house music lovers.</text>
  <!-- Bottom line separator for aesthetics -->
  <line x1="40" y1="940" x2="510" y2="940" class="line"/>
</svg>
`;

    const tempSvgPath = path.join(__dirname, 'temp-ticket-overlay.svg');
    fs.writeFileSync(tempSvgPath, svgOverlay);

    // Create ticket image
    await sharp(backgroundPath)
      .resize({ width: 550, height: 1000 }) // Resize to 550x1000px
      .composite([{ input: fs.readFileSync(tempSvgPath), blend: 'over' }])
      .toFile(ticketPath);

    fs.unlinkSync(tempSvgPath);

    res.status(200).json({
      message: 'Ticket generated successfully',
      ticketPath: `http://localhost:3000/${path.basename(ticketPath)}`,
    });
  } catch (error) {
    console.error('Error generating ticket:', error);
    res.status(500).json({ message: 'Failed to generate ticket' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});