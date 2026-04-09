/**
 * PHOENIX SUITE - Unified Application Logic
 * Merges Material Architect & Texture Lab
 */

// --- ARCHITECT CORE LOGIC ---
function updateCode() {
    const id = document.getElementById('idField').value;
    const kjs = document.getElementById('kubeJSMode').checked;
    const name = document.getElementById('nameField').value;
    const indent = "    ";
    let sb = "";

    // 1. Header
    if (kjs) {
        sb += `event.create("${id}")\n`;
    } else {
        sb += `${id.toUpperCase()} = new Material.Builder(PhoenixCore.id("${id}"))\n`;
    }

    // 2. Simple Forms
    ['ingot', 'dust', 'gem', 'plasma'].forEach(f => {
        const el = document.getElementById(f + 'Check');
        if (el && el.checked) sb += `${indent}.${f}()\n`;
    });

    if (document.getElementById('fluidCheck').checked) {
        sb += kjs ? `${indent}.liquid(new GTFluidBuilder())\n` : `${indent}.fluid()\n`;
    }

    // 3. Colors & Icons
    const primaryColor = document.getElementById('colorField').value || "FFFFFF";
    const secondaryColor = document.getElementById('secColorField').value;
    const iconSet = document.getElementById('iconSetBox').value;

    sb += `${indent}.color(0x${primaryColor})`;
    if (secondaryColor) {
        sb += `.secondaryColor(0x${secondaryColor})`;
    }
    sb += "\n";

    sb += kjs ?
        `${indent}.iconSet("${iconSet.toLowerCase()}")\n` :
        `${indent}.iconSet(MaterialIconSet.${iconSet})\n`;

    // 4. Tools
    if (document.getElementById('enableTools').checked) {
        const speed = document.getElementById('toolSpeed').value || "12.0";
        const damage = document.getElementById('toolDamage').value || "8.0";
        const durability = document.getElementById('toolDurability').value || "2048";
        const level = document.getElementById('toolLevel').value || "4";

        const selectedTools = Array.from(document.getElementById('toolTypeList').selectedOptions)
            .map(o => `GTToolType.${o.value}`);
        const typesStr = kjs ? `[${selectedTools.join(', ')}]` : `new GTToolType[]{${selectedTools.join(', ')}}`;

        sb += `${indent}.toolStats(ToolProperty.Builder.of(${speed}, ${damage}, ${durability}, ${level}, ${typesStr})`;
        if (document.getElementById('toolUnbreakable').checked) sb += `\n${indent}${indent}.unbreakable()`;
        if (document.getElementById('toolMagnetic').checked) sb += `\n${indent}${indent}.magnetic()`;
        sb += `\n${indent}${indent}.build())\n`;
    }

    // 5. Blast Furnace
    const bt = parseInt(document.getElementById('bTempField').value);
    if (bt > 0) {
        const gas = document.getElementById('gasBox').value;
        const gasVal = (gas === "null") ? "null" : (kjs ? `GTGasTier.${gas}` : `GasTier.${gas}`);
        const eut = document.getElementById('bEutField').value || "VA[EV]";
        const duration = document.getElementById('bDurationField').value || "1000";
        sb += `${indent}.blastTemp(${bt}, ${gasVal}, GTValues.${eut}, ${duration})\n`;
    }

    // 6. Fluid Pipes
    if (document.getElementById('enableFluidPipe').checked) {
        const fTemp = document.getElementById('fPipeTemp').value || "1000";
        const fThrough = document.getElementById('fPipeThroughput').value || "128";
        sb += `${indent}.fluidPipeProperties(${fTemp}, ${fThrough}, ${document.getElementById('fGas').checked}, ${document.getElementById('fAcid').checked}, ${document.getElementById('fCryo').checked}, ${document.getElementById('fPlasma').checked})\n`;
    }

    // 7. Cables
    if (document.getElementById('enableCable').checked) {
        const volt = document.getElementById('voltage').value || "HV";
        sb += `${indent}.cableProperties(GTValues.${volt}, ${document.getElementById('amperage').value || "5"}, ${document.getElementById('lossPerBlock').value || "3"}, ${document.getElementById('isSuperconductor').checked})\n`;
    }

    // 8. Flags
    const selectedFlags = Array.from(document.getElementById('flagList').selectedOptions)
        .map(o => (kjs ? "GTMaterialFlags." : "") + o.value);
    if (selectedFlags.length > 0) {
        sb += `${indent}.flags(${selectedFlags.join(', ')})\n`;
    }

    // 9. Footer
    if (!kjs) sb += `${indent}.buildAndRegister();`;

    document.getElementById('materialOutput').textContent = sb;
    document.getElementById('langOutput').value = `addMaterialLang(provider, "${id}", "${name}");`;
}

// --- TEXTURE LAB LOGIC ---
const canvas = document.getElementById('phoenixCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let layers = [];

function addLayer() {
    const id = Date.now();
    layers.push({ id: id, img: null, type: 'p' });
    const div = document.createElement('div');
    div.className = 'layer-card';
    div.id = `ui-${id}`;
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:5px;">
            <span style="opacity:0.5;">LAYER</span>
            <button onclick="removeLayer(${id})" style="color:#ff4444; background:none; border:none; cursor:pointer;">×</button>
        </div>
        <input type="file" accept="image/png" onchange="loadLayerImg(event, ${id})">
        <select onchange="updateLayerType(${id}, this.value)" style="width:100%; margin-top:5px;">
            <option value="p">Primary Color</option>
            <option value="s">Secondary Color</option>
            <option value="none">No Tint</option>
        </select>`;
    document.getElementById('layerList').appendChild(div);
}

function removeLayer(id) {
    layers = layers.filter(l => l.id !== id);
    const el = document.getElementById(`ui-${id}`);
    if(el) el.remove();
    draw();
}

function loadLayerImg(e, id) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const layer = layers.find(l => l.id === id);
            if(layer) { layer.img = img; draw(); }
        };
        img.src = ev.target.result;
    };
    if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}

function updateLayerType(id, val) {
    const layer = layers.find(l => l.id === id);
    if(layer) { layer.type = val; draw(); }
}

function draw() {
    if(!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    ctx.imageSmoothingEnabled = false;

    // Use the base config hex colors
    const p = document.getElementById('colorField').value.replace('#','');
    const s = document.getElementById('secColorField').value.replace('#','');

    layers.forEach(l => {
        if(!l.img) return;
        const b = document.createElement('canvas');
        b.width = 16; b.height = 16;
        const bCtx = b.getContext('2d');
        bCtx.imageSmoothingEnabled = false;
        bCtx.drawImage(l.img, 0, 0, 16, 16);

        if(l.type !== 'none') {
            bCtx.globalCompositeOperation = 'multiply';
            bCtx.fillStyle = `#${l.type === 'p' ? p : s}`;
            bCtx.fillRect(0, 0, 16, 16);
            bCtx.globalCompositeOperation = 'destination-in';
            bCtx.drawImage(l.img, 0, 0, 16, 16);
        }
        ctx.drawImage(b, 0, 0);
    });
}

function downloadResult() {
    const link = document.createElement('a');
    link.download = `phoenix_tex_${document.getElementById('idField').value}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// --- UTILITIES & NAVIGATION ---

const btnArch = document.getElementById('btnShowArch');
const btnLab = document.getElementById('btnShowLab');

btnArch.onclick = () => {
    document.getElementById('archSidebar').style.display = 'block';
    document.getElementById('archMainView').style.display = 'block';
    document.getElementById('labSidebar').style.display = 'none';
    document.getElementById('labMainView').style.display = 'none';
    btnArch.style.background = 'var(--accent)';
    btnLab.style.background = 'var(--input)';
};

btnLab.onclick = () => {
    document.getElementById('archSidebar').style.display = 'none';
    document.getElementById('archMainView').style.display = 'none';
    document.getElementById('labSidebar').style.display = 'block';
    document.getElementById('labMainView').style.display = 'block';
    btnLab.style.background = 'var(--accent)';
    btnArch.style.background = 'var(--input)';
    if(layers.length === 0) addLayer();
    draw(); // Draw immediately in case colors changed in Architect
};

// Symbol Logic
document.getElementById('addSymbol').onclick = () => {
    const nameField = document.getElementById('nameField');
    nameField.value += '§';
    navigator.clipboard.writeText('§');
    updateCode();
};

// Aqua Logic
document.getElementById('quickAqua').onclick = () => {
    const nameField = document.getElementById('nameField');
    if (!nameField.value.startsWith('§b')) nameField.value = '§b' + nameField.value;
    updateCode();
};

// Theme Logic
document.getElementById('themePicker').onchange = (e) => {
    const theme = e.target.value;
    document.body.classList.forEach(cls => {
        if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });
    if (theme !== 'default') document.body.classList.add(`theme-${theme}`);
};

// Global Listener
document.addEventListener('input', (e) => {
    updateCode();
    if(labMainView.style.display !== 'none') draw();
});

// Initialize
updateCode();