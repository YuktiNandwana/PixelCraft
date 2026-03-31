const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Aapke HTML, CSS, aur JS files ko serve karne ke liye
// Dhyan rakhein ki index.html, script.js aur style.css wahi ho jahan server.js hai
app.use(express.static(__dirname));

// Saare drawn shapes yahan server ki memory mein save rahenge
let globalShapes = [];

io.on('connection', (socket) => {
    console.log('Ek naya artist connect hua! ID:', socket.id);

    // Jaise hi koi naya user aaye, usko purani saari drawing dikha do
    socket.emit('init_shapes', globalShapes);

    // Jab koi user kuch draw karta hai, toh woh server ko update bhejta hai
    socket.on('update_shapes', (shapes) => {
        globalShapes = shapes; // Server apna data update karta hai
        
        // Aur jisne draw kiya usko chhod kar, baaki sabko naya update bhej deta hai
        socket.broadcast.emit('shapes_updated', globalShapes);
    });

    socket.on('disconnect', () => {
        console.log('Ek artist chala gaya:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server mast chal raha hai! Yahan check karo: http://localhost:${PORT}`);
});