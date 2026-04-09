/**
 * PHOENIX SUITE - Unified Master Edition
 * Combines full Architect logic with Texture Lab stability
 */

// --- 1. GLOBAL STATE ---
let layers = [];
let idField, nameField, colorField, secColorField, materialOutput, langOutput;

// --- 2. GLOBAL VIEW SWITCHING ---
function switchView(view) {
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

        if (layers.length === 0) addLayer();
        draw();
    }
}

// --- 3. THE ARCHITECT ENGINE (Restored from your old logic) ---
function updateCode() {
    if (!materialOutput) return;

    const id = idField.value || "unknown";
    const kjs = document.getElementById('kubeJSMode').checked;
    const name = nameField.value || "Unknown";
    const indent = "    ";
    let sb = "";

    // Header Logic
    if (kjs) {
        sb += `event.create("${id}")\n`;
    } else {
        sb += `${id.toUpperCase()} = new Material.Builder(PhoenixCore.id("${id}"))\n`;
    }

    // Basic Forms
    ['ingot', 'dust', 'gem', 'plasma'].forEach(f => {
        const el = document.getElementById(f + 'Check');
        if (el && el.checked) sb += `${indent}.${f}()\n`;
    });

    // Fluid Handling
    if (document.getElementById('fluidCheck').checked) {
        sb += kjs ? `${indent}.liquid(new GTFluidBuilder())\n` : `${indent}.fluid()\n`;
    }

    // Blast Furnace Logic
    const bt = parseInt(document.getElementById('bTempField').value);
    if (bt > 0) {
        const gas = document.getElementById('gasBox').value;
        const gasVal = (gas === "null") ? "null" : (kjs ? `GTGasTier.${gas}` : `GasTier.${gas}`);
        const eut = document.getElementById('bEutField').value || "VA[EV]";
        const duration = document.getElementById('bDurationField').value || "1000";
        sb += `${indent}.blastTemp(${bt}, ${gasVal}, GTValues.${eut}, ${duration})\n`;
    }

    // Fluid Pipes
    if (document.getElementById('enableFluidPipe').checked) {
        const fTemp = document.getElementById('fPipeTemp').value || "1000";
        const fThrough = document.getElementById('fPipeThroughput').value || "128";
        const gasProof = document.getElementById('fGas').checked;
        const acidProof = document.getElementById('fAcid').checked;
        const cryoProof = document.getElementById('fCryo').checked;
        const plasmaProof = document.getElementById('fPlasma').checked;
        sb += `${indent}.fluidPipeProperties(${fTemp}, ${fThrough}, ${gasProof}, ${acidProof}, ${cryoProof}, ${plasmaProof})\n`;
    }

    // Item Pipes
    if (document.getElementById('enableItemPipe').checked) {
        const priority = document.getElementById('itemPriority').value || "1";
        const stacks = document.getElementById('itemStacks').value || "1";
        sb += `${indent}.itemPipeProperties(${priority}, ${stacks})\n`;
    }

    // Cables
    if (document.getElementById('enableCable').checked) {
        const volt = document.getElementById('voltage').value || "HV";
        const amp = document.getElementById('amperage').value || "5";
        const loss = document.getElementById('lossPerBlock').value || "3";
        const supercon = document.getElementById('isSuperconductor').checked;
        sb += `${indent}.cableProperties(GTValues.${volt}, ${amp}, ${loss}, ${supercon})\n`;
    }

    // Rotors
    if (document.getElementById('enableRotor').checked) {
        const rPwr = document.getElementById('rotorPower').value || "130";
        const rEff = document.getElementById('rotorEff').value || "115";
        const rDmg = document.getElementById('rotorDamage').value || "3.0";
        const rDur = document.getElementById('rotorDurability').value || "1600";
        sb += `${indent}.rotorStats(${rPwr}, ${rEff}, ${rDmg}F, ${rDur})\n`;
    }

    // Colors & Icons
    const primary = colorField.value.replace('#','') || "FFFFFF";
    const secondary = secColorField.value.replace('#','');
    const iconSet = document.getElementById('iconSetBox').value;

    sb += `${indent}.color(0x${primary})`;
    if (secondary) sb += `.secondaryColor(0x${secondary})`;
    sb += "\n";
    sb += kjs ? `${indent}.iconSet("${iconSet.toLowerCase()}")\n` : `${indent}.iconSet(MaterialIconSet.${iconSet})\n`;

    // Tool Logic
    if (document.getElementById('enableTools').checked) {
        const speed = document.getElementById('toolSpeed').value || "12.0";
        const damage = document.getElementById('toolDamage').value || "8.0";
        const durability = document.getElementById('toolDurability').value || "2048";
        const level = document.getElementById('toolLevel').value || "4";
        const selectedTools = Array.from(document.getElementById('toolTypeList').selectedOptions).map(o => `GTToolType.${o.value}`);
        const typesStr = kjs ? `[${selectedTools.join(', ')}]` : `new GTToolType[]{${selectedTools.join(', ')}}`;

        if (document.getElementById('toolUnbreakable').checked || document.getElementById('toolMagnetic').checked) {
            sb += `${indent}.toolStats(ToolProperty.Builder.of(${speed}, ${damage}, ${durability}, ${level}, ${typesStr})\n`;
            if (document.getElementById('toolUnbreakable').checked) sb += `${indent}${indent}.unbreakable()\n`;
            if (document.getElementById('toolMagnetic').checked) sb += `${indent}${indent}.magnetic()\n`;
            sb += `${indent}${indent}.build())\n`;
        } else {
            sb += `${indent}.toolStats(ToolProperty.Builder.of(${speed}, ${damage}, ${durability}, ${level}, ${typesStr}).build())\n`;
        }
    }

    // Flags
    const selectedFlags = Array.from(document.getElementById('flagList').selectedOptions).map(o => (kjs ? "GTMaterialFlags." : "") + o.value);
    if (selectedFlags.length > 0) sb += `${indent}.flags(${selectedFlags.join(', ')})\n`;

    if (!kjs) sb += `${indent}.buildAndRegister();`;

    materialOutput.textContent = sb;
    if (langOutput) langOutput.value = `addMaterialLang(provider, "${id}", "${name}");`;
    draw();
}

// --- 4. TEXTURE LAB ENGINE ---
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
    const canvas = document.getElementById('phoenixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    const p = (document.getElementById('colorField').value || "FFFFFF").replace('#','');
    const s = (document.getElementById('secColorField').value || "FFFFFF").replace('#','');
    layers.forEach(l => {
        if(!l.img) return;
        const b = document.createElement('canvas');
        b.width = 16; b.height = 16;
        const bCtx = b.getContext('2d');
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
    const canvas = document.getElementById('phoenixCanvas');
    const link = document.createElement('a');
    link.download = 'material_texture.png';
    link.href = canvas.toDataURL();
    link.click();
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    idField = document.getElementById('idField');
    nameField = document.getElementById('nameField');
    colorField = document.getElementById('colorField');
    secColorField = document.getElementById('secColorField');
    materialOutput = document.getElementById('materialOutput');
    langOutput = document.getElementById('langOutput');

    // Restore your "Copied!" button feedback logic
    document.getElementById('addSymbol').onclick = () => {
        const symbol = '§';
        nameField.value += symbol;
        navigator.clipboard.writeText(symbol).then(() => {
            const btn = document.getElementById('addSymbol');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = originalText, 1000);
        });
        updateCode();
    };

    document.getElementById('quickAqua').onclick = () => {
        if (!nameField.value.startsWith('§b')) {
            nameField.value = '§b' + nameField.value;
            updateCode();
        }
    };

    document.getElementById('themePicker').onchange = (e) => {
        document.body.classList.forEach(c => { if(c.startsWith('theme-')) document.body.classList.remove(c); });
        if(e.target.value !== 'default') document.body.classList.add(`theme-${e.target.value}`);
    };

    document.addEventListener('input', updateCode);
    updateCode();
});