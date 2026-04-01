# PixelCraft 🎨
**A Real-Time Multiplayer Collaborative Whiteboard**

PixelCraft is a seamless, real-time digital canvas where multiple users can draw and collaborate simultaneously. Built from scratch to understand WebSockets, the app features zero-latency syncing—draw on your mobile device and watch it instantly appear on your desktop screen!

## Features
- **Zero-Latency Sync:** Powered by Socket.io for instant 2-way data transfer.
- **Cross-Device Compatibility:** Works flawlessly across laptops, tablets, and mobile phones.
- **Touch-Optimized:** Built-in logic to prevent mobile screen scrolling/zooming while drawing.
- **Tools Included:** Freehand brush, Erase, Rectangles, and Circles.
- **Smart State Management:** Array-based Undo, Redo, and Clear Canvas functionality.
- **Dark Mode Support:** Toggle between light and dark themes effortlessly.
- **Export Artwork:** Download your final masterpiece as a PNG file.

##  Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Canvas API
- **Backend:** Node.js, Express.js
- **Real-Time Engine:** Socket.io

##  Getting Started (Run Locally)
To test this project on your own machine and sync it with your phone, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YuktiNandwana/PixelCraft.git](https://github.com/YuktiNandwana/PixelCraft.git)
   cd PixelCraft

2. **Install dependencies:**

  npm install

3.  **Start the server:**

 node server.js

4.  **Open in your browser:**

  On your Desktop/Laptop: Go to http://localhost:3000

  On your Mobile Phone: Connect your phone to the same WiFi network as your laptop. Find your laptop's IPv4 address (e.g., 192.168.1.5 or 10.x.x.x). Open your phone's browser and go to http://<your-ip-address>:3000.

Now, draw on your phone and watch the magic happen on your laptop screen!

🤝 Contributing
Contributions, issues, and feature requests are highly welcome! I built this to learn, and I'd love to see how the community can make it better.

 Feel free to check issues page if you want to contribute. Some future ideas:

    Adding a chat box feature.

    Adding user cursors with names.

    Implementing rooms for private drawing sessions.

1. Fork the Project

2. Create your Feature Branch (git checkout -b feature/AmazingFeature)

3. Commit your Changes (git commit -m 'Add some AmazingFeature')

4. Push to the Branch (git push origin feature/AmazingFeature)

5. Open a Pull Request

Developed 

https://github.com/user-attachments/assets/4de8fa31-c1c5-4ff3-b378-0b2155d5bd10

by Yukti Nandwana
