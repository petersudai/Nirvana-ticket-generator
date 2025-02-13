from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import random
import qrcode
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)

# Directories setup
TICKETS_DIR = "tickets"
if not os.path.exists(TICKETS_DIR):
    os.makedirs(TICKETS_DIR)

# Ticket Background Settings
TICKET_WIDTH, TICKET_HEIGHT = 550, 1000
BACKGROUND_IMAGE = "ticket-blurry-background.png"

# Font paths
FONT_PATH = "Candara.ttf"  # Use Arial as fallback
FONT_TITLE = ImageFont.truetype(FONT_PATH, 28)
FONT_NUMBER = ImageFont.truetype(FONT_PATH, 36)
FONT_INFO = ImageFont.truetype(FONT_PATH, 24)
FONT_DETAILS = ImageFont.truetype(FONT_PATH, 22)
FONT_MORE_INFO = ImageFont.truetype(FONT_PATH, 20)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/generate-ticket', methods=['POST'])
def generate_ticket():
    data = request.get_json()
    name = data.get("name")

    if not name:
        return jsonify({"message": "Name is required"}), 400

    ticket_id = f"NIRVANA-{random.randint(100000, 9999999)}"
    ticket_filename = f"{ticket_id}.png"
    ticket_path = os.path.join(TICKETS_DIR, ticket_filename)

    try:
        # Load background image
        background = Image.open(BACKGROUND_IMAGE).resize((TICKET_WIDTH, TICKET_HEIGHT))

        # Create a new ticket with the background
        ticket = background.copy()
        draw = ImageDraw.Draw(ticket)

        # QR Code Generation
        qr = qrcode.make(ticket_id)
        qr = qr.resize((200, 200))  # Adjust QR size
        ticket.paste(qr, (175, 40))  # Position QR code

        # Perforation effect (black semicircles on left and right edges)
        perforation_radius = 12
        draw.pieslice((0, 494 - perforation_radius, perforation_radius * 2, 494 + perforation_radius), 
                      start=270, end=90, fill="black")  # Left perforation
        draw.pieslice((TICKET_WIDTH - (perforation_radius * 2), 494 - perforation_radius, TICKET_WIDTH, 494 + perforation_radius), 
                      start=90, end=270, fill="black")  # Right perforation

        # Draw text
        draw.text((275, 340), "Ticket Number:", fill="#FEFAF6", font=FONT_NUMBER, anchor="mm")
        draw.text((275, 380), ticket_id, fill="#FEFAF6", font=FONT_NUMBER, anchor="mm")

        # Separator line
        draw.line((40, 420, 510, 420), fill="#CCCCCC", width=1)

        # Attendee info
        draw.text((275, 460), "Attendee:", fill="#BCA37F", font=FONT_INFO, anchor="mm")
        draw.text((275, 500), name, fill="#FEFAF6", font=FONT_DETAILS, anchor="mm")

        # Separator line
        draw.line((40, 540, 510, 540), fill="#CCCCCC", width=1)

        # Event details
        draw.text((275, 580), "Event: NIRVANA", fill="#BCA37F", font=FONT_TITLE, anchor="mm")
        draw.text((275, 620), "Venue: Syokimau Country Club", fill="#FEFAF6", font=FONT_DETAILS, anchor="mm")
        draw.text((275, 660), "Sat 30th November", fill="#FEFAF6", font=FONT_DETAILS, anchor="mm")
        draw.text((275, 700), "2000hrs", fill="#FEFAF6", font=FONT_DETAILS, anchor="mm")

        # Separator line
        draw.line((40, 740, 510, 740), fill="#CCCCCC", width=1)

        # More Info Section
        draw.text((275, 780), "🎶 Dive Into Nirvana: A Night of House Music Bliss! 🌌", fill="white", font=FONT_MORE_INFO, anchor="mm")
        draw.text((275, 820), "Get ready to experience the ultimate house party at Nirvana!", fill="white", font=FONT_MORE_INFO, anchor="mm")
        draw.text((275, 860), "Join us for an unforgettable night filled with pulsating beats,", fill="white", font=FONT_MORE_INFO, anchor="mm")
        draw.text((275, 900), "electric energy, and a vibrant community of house music lovers.", fill="white", font=FONT_MORE_INFO, anchor="mm")

        # Bottom separator
        draw.line((40, 940, 510, 940), fill="#CCCCCC", width=1)

        # Save ticket
        ticket.save(ticket_path)

        return jsonify({"ticketPath": f"/tickets/{ticket_filename}"})

    except Exception as e:
        return jsonify({"message": f"Error generating ticket: {str(e)}"}), 500

@app.route('/tickets/<filename>')
def get_ticket(filename):
    return send_from_directory(TICKETS_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
