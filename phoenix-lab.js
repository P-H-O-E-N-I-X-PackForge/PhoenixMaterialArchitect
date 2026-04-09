const canvas = document.getElementById('phoenixCanvas');
const ctx = canvas.getContext('2d');
const layerList = document.getElementById('layerList');

// Set internal resolution to 16x16 immediately
canvas.width = 16;
canvas.height = 16;

let layers = [];

function addLayer() {
    const id = Date.now(); // Use timestamp for unique IDs
    const layerObj = { id: id, img: null, type: 'p' };
    layers.push(layerObj);

    const div = document.createElement('div');
    div.className = 'layer-card';
    div.id = `layer-ui-${id}`;
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span style="font-size:10px; opacity:0.6;">NEW LAYER</span>
            <button onclick="removeLayer(${id})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-weight:bold;">×</button>
        </div>
        <input type="file" accept="image/png" onchange="loadLayerImage(event, ${id})">
        <select onchange="updateTint(${id}, this.value)" style="margin-top:8px;">
            <option value="p">Use Primary Color</option>
            <option value="s">Use Secondary Color</option>
            <option value="none">No Tint (Raw)</option>
        </select>
    `;
    layerList.appendChild(div);
}

function removeLayer(id) {
    // Remove from logic
    layers = layers.filter(l => l.id !== id);
    // Remove from UI
    const uiElement = document.getElementById(`layer-ui-${id}`);
    if (uiElement) uiElement.remove();
    draw();
}

function loadLayerImage(e, id) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const index = layers.findIndex(l => l.id === id);
            if (index !== -1) {
                layers[index].img = img;
                draw();
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateTint(id, val) {
    const index = layers.findIndex(l => l.id === id);
    if (index !== -1) {
        layers[index].type = val;
        draw();
    }
}

function draw() {
    // 1. Clear and Disable Smoothing
    ctx.clearRect(0, 0, 16, 16);
    ctx.imageSmoothingEnabled = false;

    const pCol = document.getElementById('pColor').value.replace('#', '');
    const sCol = document.getElementById('sColor').value.replace('#', '');

    layers.forEach(layer => {
        if (!layer.img) return;

        // Create a 16x16 buffer
        const buffer = document.createElement('canvas');
        buffer.width = 16;
        buffer.height = 16;
        const bCtx = buffer.getContext('2d');
        bCtx.imageSmoothingEnabled = false;

        // Draw grayscale base
        bCtx.drawImage(layer.img, 0, 0, 16, 16);

        if (layer.type !== 'none') {
            const hex = (layer.type === 'p') ? pCol : sCol;

            // Apply Multiply Tint
            bCtx.globalCompositeOperation = 'multiply';
            bCtx.fillStyle = `#${hex}`;
            bCtx.fillRect(0, 0, 16, 16);

            // Re-mask to the shape of the original image
            bCtx.globalCompositeOperation = 'destination-in';
            bCtx.drawImage(layer.img, 0, 0, 16, 16);
        }

        // Draw finished layer to main canvas
        ctx.drawImage(buffer, 0, 0);
    });
}

function downloadResult() {
    // 1. Create a "hidden" temporary canvas to ensure no CSS scaling interferes
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 16;
    tempCanvas.height = 16;
    const tCtx = tempCanvas.getContext('2d');

    // 2. Disable smoothing on the temp canvas
    tCtx.imageSmoothingEnabled = false;

    // 3. Re-draw the layers onto the hidden canvas
    const pCol = document.getElementById('pColor').value.replace('#', '');
    const sCol = document.getElementById('sColor').value.replace('#', '');

    layers.forEach(layer => {
        if (!layer.img) return;

        const buffer = document.createElement('canvas');
        buffer.width = 16;
        buffer.height = 16;
        const bCtx = buffer.getContext('2d');
        bCtx.imageSmoothingEnabled = false;

        bCtx.drawImage(layer.img, 0, 0, 16, 16);

        if (layer.type !== 'none') {
            const hex = (layer.type === 'p') ? pCol : sCol;
            bCtx.globalCompositeOperation = 'multiply';
            bCtx.fillStyle = `#${hex}`;
            bCtx.fillRect(0, 0, 16, 16);
            bCtx.globalCompositeOperation = 'destination-in';
            bCtx.drawImage(layer.img, 0, 0, 16, 16);
        }
        tCtx.drawImage(buffer, 0, 0);
    });

    // 4. Trigger the download from the "clean" 16x16 source
    const link = document.createElement('a');
    // Generate a name based on the current Primary Hex
    link.download = `phoenix_${pCol}_icon.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
}

// Global listeners
document.getElementById('pColor').oninput = draw;
document.getElementById('sColor').oninput = draw;

// Start with one layer
addLayer();