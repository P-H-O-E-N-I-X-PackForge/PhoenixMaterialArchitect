/**
 * PHOENIX SUITE - Master Unified Logic
 * Optimized for Architect Logic, Texture Lab, and 3D Block Preview
 */

// --- GLOBALS ---
let layers = [];
let templateLayers = { base: null, overlay: null };
let animationInterval = null;
let currentFrame = 0;
let maxFrames = 1;

document.addEventListener('DOMContentLoaded', () => {
    const idField = document.getElementById('idField');
    const nameField = document.getElementById('nameField');
    const colorField = document.getElementById('colorField');
    const secColorField = document.getElementById('secColorField');
    const materialOutput = document.getElementById('materialOutput');
    const langOutput = document.getElementById('langOutput');

    startAnimation();

    window.switchView = function(view) {
        const archSidebar = document.getElementById('archSidebar');
        const labSidebar = document.getElementById('labSidebar');
        const archMain = document.getElementById('archMainView');
        const labMain = document.getElementById('labMainView');
        const btnArch = document.getElementById('btnShowArch');
        const btnLab = document.getElementById('btnShowLab');

        if (view === 'arch') {
            archSidebar.style.display = 'block';
            archMain.style.display = 'block';
            labSidebar.style.display = 'none';
            labMain.style.display = 'none';
            btnArch.style.background = 'var(--accent)';
            btnLab.style.background = 'var(--input)';
        } else {
            archSidebar.style.display = 'none';
            archMain.style.display = 'none';
            labSidebar.style.display = 'block';
            labMain.style.display = 'block';
            btnLab.style.background = 'var(--accent)';
            btnArch.style.background = 'var(--input)';

            if (layers.length === 0 && !templateLayers.base) {
                drawDefaultStone();
            } else {
                draw();
            }
        }
    };

    document.getElementById('btnShowArch').onclick = () => switchView('arch');
    document.getElementById('btnShowLab').onclick = () => switchView('lab');

    function updateCode() {
        if (!materialOutput) return;
        const id = idField.value || "unknown";
        const kjs = document.getElementById('kubeJSMode').checked;
        const name = nameField.value || "Unknown";
        const indent = "    ";
        let sb = "";

        // 1. Core Material Declaration
        if (kjs) {
            sb += `event.create("${id}")\n`;
        } else {
            sb += `${id.toUpperCase()} = new Material.Builder(PhoenixCore.id("${id}"))\n`;
        }

        // 2. Parts & Fluids
        ['ingot', 'dust', 'gem', 'plasma'].forEach(f => {
            const el = document.getElementById(f + 'Check');
            if (el && el.checked) sb += `${indent}.${f}()\n`;
        });

        if (document.getElementById('fluidCheck').checked) {
            sb += kjs ? `${indent}.liquid(new GTFluidBuilder())\n` : `${indent}.fluid()\n`;
        }

        // 3. Blast Furnace Properties
        const bt = parseInt(document.getElementById('bTempField').value);
        if (bt > 0) {
            const gas = document.getElementById('gasBox').value;
            const gasVal = (gas === "null") ? "null" : (kjs ? `GTGasTier.${gas}` : `GasTier.${gas}`);
            const eut = document.getElementById('bEutField').value || "VA[EV]";
            const duration = document.getElementById('bDurationField').value || "1000";
            sb += `${indent}.blastTemp(${bt}, ${gasVal}, GTValues.${eut}, ${duration})\n`;
        }

        // 4. Pipes & Cables (RESTORED)
        if (document.getElementById('enableFluidPipe')?.checked) {
            const fTemp = document.getElementById('fPipeTemp').value || "1000";
            const fThrough = document.getElementById('fPipeThroughput').value || "128";
            sb += `${indent}.fluidPipeProperties(${fTemp}, ${fThrough}, ${document.getElementById('fGas').checked}, ${document.getElementById('fAcid').checked}, ${document.getElementById('fCryo').checked}, ${document.getElementById('fPlasma').checked})\n`;
        }

        if (document.getElementById('enableItemPipe')?.checked) {
            const priority = document.getElementById('itemPriority').value || "1";
            const stacks = document.getElementById('itemStacks').value || "1";
            sb += `${indent}.itemPipeProperties(${priority}, ${stacks})\n`;
        }

        if (document.getElementById('enableCable')?.checked) {
            const volt = document.getElementById('voltage').value || "HV";
            const amp = document.getElementById('amperage').value || "5";
            const loss = document.getElementById('lossPerBlock').value || "3";
            sb += `${indent}.cableProperties(GTValues.${volt}, ${amp}, ${loss}, ${document.getElementById('isSuperconductor').checked})\n`;
        }
        // --- ROTOR STATS ---
        if (document.getElementById('enableRotor')?.checked) {
            const rPwr = document.getElementById('rotorPower').value || "130";
            const rEff = document.getElementById('rotorEff').value || "115";
            const rDmg = document.getElementById('rotorDamage').value || "3.0";
            const rDur = document.getElementById('rotorDurability').value || "1600";
            sb += `${indent}.rotorStats(${rPwr}, ${rEff}, ${rDmg}F, ${rDur})\n`;
        }

        // 5. Tool Properties (RESTORED)
        if (document.getElementById('enableTools')?.checked) {
            const speed = document.getElementById('toolSpeed').value || "12.0";
            const damage = document.getElementById('toolDamage').value || "8.0";
            const durability = document.getElementById('toolDurability').value || "2048";
            const level = document.getElementById('toolLevel').value || "4";
            const selectedTools = Array.from(document.getElementById('toolTypeList').selectedOptions).map(o => `GTToolType.${o.value}`);
            const typesStr = kjs ? `[${selectedTools.join(', ')}]` : `new GTToolType[]{${selectedTools.join(', ')}}`;
            sb += `${indent}.toolStats(ToolProperty.Builder.of(${speed}, ${damage}, ${durability}, ${level}, ${typesStr})\n`;
            if (document.getElementById('toolUnbreakable').checked) sb += `${indent}${indent}.unbreakable()\n`;
            if (document.getElementById('toolMagnetic').checked) sb += `${indent}${indent}.magnetic()\n`;
            sb += `${indent}${indent}.build())\n`;
        }

        // 6. Visuals
        const primary = colorField.value.replace('#', '') || "FFFFFF";
        const secondary = secColorField.value.replace('#', '');
        const iconSet = document.getElementById('iconSetBox').value;
        sb += `${indent}.color(0x${primary})`;
        if (secondary) sb += `.secondaryColor(0x${secondary})`;
        sb += "\n";
        sb += kjs ? `${indent}.iconSet("${iconSet.toLowerCase()}")\n` : `${indent}.iconSet(MaterialIconSet.${iconSet})\n`;

        const selectedFlags = Array.from(document.getElementById('flagList').selectedOptions).map(o => (kjs ? "GTMaterialFlags." : "") + o.value);
        if (selectedFlags.length > 0) sb += `${indent}.flags(${selectedFlags.join(', ')})\n`;

        if (!kjs) sb += `${indent}.buildAndRegister();`;

        materialOutput.textContent = sb;
        if (langOutput) langOutput.value = `addMaterialLang(provider, "${id}", "${name}");`;
    }

    // UI Buttons
    document.getElementById('addSymbol').onclick = () => { nameField.value += '§'; updateCode(); };
    document.getElementById('quickAqua').onclick = () => { if (!nameField.value.startsWith('§b')) nameField.value = '§b' + nameField.value; updateCode(); };
    document.getElementById('themePicker').onchange = (e) => {
        document.body.classList.forEach(c => { if (c.startsWith('theme-')) document.body.classList.remove(c); });
        if (e.target.value !== 'default') document.body.classList.add(`theme-${e.target.value}`);
    };

    document.addEventListener('input', updateCode);
    updateCode();
    drawDefaultStone();
});

// --- TEXTURE ENGINE ---

function draw() {
    const canvas = document.getElementById('phoenixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);

    const p = (document.getElementById('colorField').value || "FFFFFF").replace('#', '');
    const s = (document.getElementById('secColorField').value || "FFFFFF").replace('#', '');

    const renderLayer = (img, hexColor) => {
        if (!img) return;
        const framesInImg = img.height / 16;
        const frameIdx = (framesInImg > 1) ? (currentFrame % framesInImg) : 0;

        const temp = document.createElement('canvas');
        temp.width = 16; temp.height = 16;
        const tCtx = temp.getContext('2d');

        tCtx.drawImage(img, 0, frameIdx * 16, 16, 16, 0, 0, 16, 16);

        if (hexColor !== 'none' && hexColor !== '') {
            tCtx.globalCompositeOperation = 'multiply';
            tCtx.fillStyle = `#${hexColor}`;
            tCtx.fillRect(0, 0, 16, 16);
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(img, 0, frameIdx * 16, 16, 16, 0, 0, 16, 16);
        }
        ctx.drawImage(temp, 0, 0);
    };

    // 1. Draw Templates (Primary then Secondary/Radioactive)
    renderLayer(templateLayers.base, p);
    renderLayer(templateLayers.overlay, s);

    // 2. Draw Manual Layers
    layers.forEach(l => {
        if (l.img) renderLayer(l.img, l.type === 'p' ? p : (l.type === 's' ? s : 'none'));
    });

    updateBlockTextures();
}

async function loadSetTemplate(type) {
    if (type === 'none') {
        templateLayers = { base: null, overlay: null };
        maxFrames = 1;
        draw();
        return;
    }

    const iconSet = document.getElementById('iconSetBox').value.toLowerCase();

    // Radioactive logic: Metallic Base + Radioactive Overlay
    if (iconSet === 'radioactive') {
        templateLayers.base = await loadImage(`src/textures/item/material_sets/metallic/${type}.png`);
        templateLayers.overlay = await loadImage(`src/textures/item/material_sets/radioactive/${type}_secondary.png`);
    } else {
        templateLayers.base = await loadImage(`src/textures/item/material_sets/${iconSet}/${type}.png`);
        templateLayers.overlay = await loadImage(`src/textures/item/material_sets/${iconSet}/${type}_secondary.png`);
    }

    const bH = templateLayers.base?.height || 0;
    const oH = templateLayers.overlay?.height || 0;
    maxFrames = Math.max(bH, oH, 16) / 16;

    document.getElementById('pathDisplay').textContent = `${iconSet}/${type}.png`;
    draw();
}

function startAnimation() {
    if (animationInterval) clearInterval(animationInterval);
    animationInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % 64;
        // Always draw once to ensure the cube is initialized, then only if animated
        if (maxFrames > 1 || layers.some(l => l.img && l.img.height > 16)) {
            draw();
        }
    }, 50);
}

// --- BLOCK PREVIEW (FIXED SCALING) ---
function updateBlockTextures() {
    const canvas = document.getElementById('phoenixCanvas');
    if (!canvas) return;

    // Use toDataURL directly - modern browsers handle the scaling via CSS image-rendering
    const texture = canvas.toDataURL();
    const faces = document.querySelectorAll('.face');

    faces.forEach(face => {
        face.style.backgroundImage = `url(${texture})`;
        face.style.backgroundSize = '100% 100%';
        face.style.imageRendering = 'pixelated'; // Keeps the pixels sharp
    });
}

// --- UTILITIES ---
function addLayer() {
    const list = document.getElementById('layerList');
    if (!list) return;
    const id = Date.now();
    layers.push({ id: id, img: null, type: 'p' });
    const div = document.createElement('div');
    div.className = 'layer-card';
    div.id = `ui-${id}`;
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:5px;">
            <span>LAYER</span>
            <button onclick="removeLayer(${id})" style="color:#ff5555; background:none; border:none; cursor:pointer;">×</button>
        </div>
        <input type="file" accept="image/png" onchange="loadLayerImg(event, ${id})">
        <select onchange="updateLayerType(${id}, this.value)">
            <option value="p">Primary</option><option value="s">Secondary</option><option value="none">None</option>
        </select>`;
    list.appendChild(div);
}

function removeLayer(id) {
    layers = layers.filter(l => l.id !== id);
    const el = document.getElementById(`ui-${id}`);
    if (el) el.remove();
    draw();
}

function loadLayerImg(e, id) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const layer = layers.find(l => l.id === id);
            if (layer) { layer.img = img; draw(); }
        };
        img.src = ev.target.result;
    };
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}

function updateLayerType(id, val) {
    const layer = layers.find(l => l.id === id);
    if (layer) { layer.type = val; draw(); }
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function drawDefaultStone() {
    const canvas = document.getElementById('phoenixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const shades = [120, 112, 105, 128, 118, 110, 125];
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const v = shades[(x * 3 + y * 7) % shades.length];
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    updateBlockTextures();
}

window.setLabMode = function(mode) {
    const itemContainer = document.getElementById('itemPreviewContainer');
    const blockContainer = document.getElementById('blockPreviewContainer');
    const btnItem = document.getElementById('toggleItemView');
    const btnBlock = document.getElementById('toggleBlockView');

    if (mode === 'block') {
        itemContainer.style.display = 'none';
        blockContainer.style.display = 'flex';
        btnBlock.style.background = 'var(--accent)';
        btnItem.style.background = 'var(--input)';
        requestAnimationFrame(() => updateBlockTextures());
    } else {
        itemContainer.style.display = 'inline-block';
        blockContainer.style.display = 'none';
        btnItem.style.background = 'var(--accent)';
        btnBlock.style.background = 'var(--input)';
    }
};

document.getElementById('iconSetBox').addEventListener('change', () => {
    const labSelect = document.getElementById('labIconSetPreview');
    if (labSelect) loadSetTemplate(labSelect.value);
});

function downloadResult() {
    const canvas = document.getElementById('phoenixCanvas');
    if (!canvas) return;

    // Create a static snapshot of the current frame
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement('a');
    const id = document.getElementById('idField')?.value || "material";
    link.download = `${id}_texture.png`;
    link.href = dataUrl;
    link.click();
}
