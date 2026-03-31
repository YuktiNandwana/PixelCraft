// Server se connect karo (yeh apne aap IP ya localhost detect kar lega)
const socket = io();

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const colorPreview = document.getElementById('colorPreview');
const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
const brushSizeSlider = document.getElementById('brushSize');

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

// --- NAYA OBJECT-BASED ARCHITECTURE ---
let shapes = []; // Saare drawn objects yahan rahenge
let currentShape = null; // Jo abhi draw ho raha hai
let selectedShapeIndex = -1; // Jisko drag karna hai
let isDrawing = false;
let isDragging = false;
let dragStartX, dragStartY;

let undoStack = [];
let redoStack = [];

let brushColor = '#000000'; 
let canvasBackgroundColor = '#ffffff';

const setCanvasBackground = () => {
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#1a1a2e' : canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// --- CORE RENDERING ENGINE ---
function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBackground();

    shapes.forEach((shape, index) => {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.width;
        ctx.lineCap = 'round';

        // Agar shape selected hai, toh usko thoda glow/highlight do
        if (index === selectedShapeIndex) {
            ctx.shadowColor = '#1877f2';
            ctx.shadowBlur = 10;
        } else {
            ctx.shadowBlur = 0;
        }

        if (shape.type === 'freehand' || shape.type === 'eraser') {
            if (shape.points.length > 0) {
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                shape.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        } else if (shape.type === 'rectangle') {
            ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        } else if (shape.type === 'circle') {
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
    ctx.shadowBlur = 0; // Reset shadow
}

// --- TOOLS & UI ---
let currentTool = 'freehand';
canvas.className = 'crosshair-cursor';

toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.active-tool').classList.remove('active-tool');
        btn.classList.add('active-tool');
        currentTool = btn.getAttribute('data-tool');
        selectedShapeIndex = -1; // Tool badalte hi selection hata do
        redrawAll();
        
        // Cursor badlo
        if (currentTool === 'select') canvas.className = 'default-cursor';
        else canvas.className = 'crosshair-cursor';
    });
});

brushSizeSlider.addEventListener('input', (e) => ctx.lineWidth = e.target.value);
colorPicker.addEventListener('input', (e) => {
    brushColor = e.target.value;
    colorPreview.style.background = brushColor;
});

const getCoordinates = (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
};

// --- HIT TESTING (Check karna ki mouse kis shape pe hai) ---
function getShapeAtPosition(x, y) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'rectangle') {
            const minX = Math.min(shape.x, shape.x + shape.w);
            const maxX = Math.max(shape.x, shape.x + shape.w);
            const minY = Math.min(shape.y, shape.y + shape.h);
            const maxY = Math.max(shape.y, shape.y + shape.h);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) return i;
        } else if (shape.type === 'circle') {
            const distance = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
            if (distance <= shape.radius) return i;
        }
    }
    return -1;
}

// --- SOCKET.IO SYNC FUNCTION ---
const syncWithServer = () => {
    socket.emit('update_shapes', shapes);
};

// --- INTERACTION LOGIC ---
const startInteraction = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (currentTool === 'select') {
        selectedShapeIndex = getShapeAtPosition(x, y);
        if (selectedShapeIndex !== -1) {
            isDragging = true;
            dragStartX = x;
            dragStartY = y;
            canvas.className = 'move-cursor';
        }
        redrawAll();
        return;
    }

    isDrawing = true;
    let actualColor = currentTool === 'eraser' ? canvasBackgroundColor : brushColor;
    
    if (currentTool === 'freehand' || currentTool === 'eraser') {
        currentShape = { type: currentTool, color: actualColor, width: brushSizeSlider.value, points: [{ x, y }] };
    } else if (currentTool === 'rectangle') {
        currentShape = { type: 'rectangle', color: actualColor, width: brushSizeSlider.value, x: x, y: y, w: 0, h: 0 };
    } else if (currentTool === 'circle') {
        currentShape = { type: 'circle', color: actualColor, width: brushSizeSlider.value, x: x, y: y, radius: 0 };
    }
    shapes.push(currentShape);
};

const performInteraction = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (currentTool === 'select' && isDragging && selectedShapeIndex !== -1) {
        const dx = x - dragStartX;
        const dy = y - dragStartY;
        const shape = shapes[selectedShapeIndex];
        
        if (shape.type === 'rectangle' || shape.type === 'circle') {
            shape.x += dx;
            shape.y += dy;
        } else if (shape.type === 'freehand' || shape.type === 'eraser') {
            shape.points.forEach(p => { p.x += dx; p.y += dy; });
        }
        
        dragStartX = x;
        dragStartY = y;
        redrawAll();
        return;
    }

    if (!isDrawing) return;

    if (currentTool === 'freehand' || currentTool === 'eraser') {
        currentShape.points.push({ x, y });
    } else if (currentTool === 'rectangle') {
        currentShape.w = x - currentShape.x;
        currentShape.h = y - currentShape.y;
    } else if (currentTool === 'circle') {
        currentShape.radius = Math.sqrt((x - currentShape.x) ** 2 + (y - currentShape.y) ** 2);
    }
    redrawAll();
};

const stopInteraction = () => {
    if (isDrawing || isDragging) {
        isDrawing = false;
        isDragging = false;
        if (currentTool === 'select') canvas.className = 'default-cursor';
        
        saveState(); 
        syncWithServer(); // Naya state server ko bhejo
    }
};

canvas.addEventListener('mousedown', startInteraction);
canvas.addEventListener('mousemove', performInteraction);
canvas.addEventListener('mouseup', stopInteraction);
canvas.addEventListener('mouseout', stopInteraction);
canvas.addEventListener('touchstart', startInteraction, { passive: false });
canvas.addEventListener('touchmove', performInteraction, { passive: false });
canvas.addEventListener('touchend', stopInteraction);

// --- SMART UNDO/REDO (Array Based) ---
function saveState() {
    undoStack.push(JSON.parse(JSON.stringify(shapes)));
    redoStack = []; 
}

document.getElementById('undoBtn').addEventListener('click', () => {
    if (undoStack.length > 1) { 
        redoStack.push(undoStack.pop());
        shapes = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
        redrawAll();
        syncWithServer(); // Sync lagaya gaya hai
    }
});

document.getElementById('redoBtn').addEventListener('click', () => {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        shapes = JSON.parse(JSON.stringify(state));
        redrawAll();
        syncWithServer(); // Sync lagaya gaya hai
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    shapes = [];
    selectedShapeIndex = -1;
    saveState();
    redrawAll();
    syncWithServer(); // Sync lagaya gaya hai
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'PixelCraft-Masterpiece.png'; 
    link.href = canvas.toDataURL(); 
    link.click();
});

// --- DARK MODE LOGIC ---
const darkModeToggle = document.getElementById('darkModeToggle');
if(darkModeToggle) {
    const darkModeIcon = darkModeToggle.querySelector('span');
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            darkModeIcon.textContent = 'light_mode';
            darkModeToggle.style.color = '#fff';
        } else {
            darkModeIcon.textContent = 'dark_mode';
            darkModeToggle.style.color = '#333';
        }
        redrawAll(); 
    });
}

// --- SOCKET.IO LISTENERS ---
// Jab server se naye shapes aayein (kisi aur ne draw/undo/clear kiya ho)
socket.on('shapes_updated', (serverShapes) => {
    shapes = serverShapes; 
    
    // Remote update ke baad apne undo stack mein bhi daal lo, taaki sync rahe
    if(undoStack.length === 0 || JSON.stringify(undoStack[undoStack.length - 1]) !== JSON.stringify(shapes)) {
         undoStack.push(JSON.parse(JSON.stringify(shapes)));
    }
    
    redrawAll(); 
});

// Pehli baar page load hone pe
socket.on('init_shapes', (serverShapes) => {
    if(serverShapes.length > 0) {
        shapes = serverShapes;
        saveState(); // Init state ko stack mein daalo
        redrawAll();
    }
});

window.addEventListener("load", () => {
    // Agar server se init nahi hua hai pehle, tab local empty state save karein
    if(undoStack.length === 0){
        saveState();
    }
    redrawAll();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.7;
    redrawAll();
});