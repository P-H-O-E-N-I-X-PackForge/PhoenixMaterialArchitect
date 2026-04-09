/**
 * PHOENIX SUITE - Deployment Ready Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const archSidebar = document.getElementById('archSidebar');
    const labSidebar = document.getElementById('labSidebar');
    const archMain = document.getElementById('archMainView');
    const labMain = document.getElementById('labMainView');
    const btnArch = document.getElementById('btnShowArch');
    const btnLab = document.getElementById('btnShowLab');

    // Checkboxes and Inputs
    const idField = document.getElementById('idField');
    const nameField = document.getElementById('nameField');
    const colorField = document.getElementById('colorField');
    const secColorField = document.getElementById('secColorField');
    const materialOutput = document.getElementById('materialOutput');
    const langOutput = document.getElementById('langOutput');

    // --- VIEW SWITCHING LOGIC ---
    if (btnArch && btnLab) {
        btnArch.onclick = () => {
            if(archSidebar) archSidebar.style.display = 'block';
            if(archMain) archMain.style.display = 'block';
            if(labSidebar) labSidebar.style.display = 'none';
            if(labMain) labMain.style.display = 'none';

            btnArch.style.background = 'var(--accent)';
            btnLab.style.background = 'var(--input)';
        };

        btnLab.onclick = () => {
            if(archSidebar) archSidebar.style.display = 'none';
            if(archMain) archMain.style.display = 'none';
            if(labSidebar) labSidebar.style.display = 'block';
            if(labMain) labMain.style.display = 'block';

            btnLab.style.background = 'var(--accent)';
            btnArch.style.background = 'var(--input)';

            if(typeof layers !== 'undefined' && layers.length === 0) {
                addLayer();
            }
            draw(); // Initialize canvas
        };
    }

    // --- ARCHITECT ENGINE ---
    function updateCode() {
        if (!materialOutput) return;

        const id = idField.value || "unknown";
        const kjs = document.getElementById('kubeJSMode').checked;
        const name = nameField.value || "Unknown";
        const indent = "    ";
        let sb = "";

        // Header
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
        const fluidCheck = document.getElementById('fluidCheck');
        if (fluidCheck && fluidCheck.checked) {
            sb += kjs ? `${indent}.liquid(new GTFluidBuilder())\n` : `${indent}.fluid()\n`;
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
        const toolCheck = document.getElementById('enableTools');
        if (toolCheck && toolCheck.checked) {
            const speed = document.getElementById('toolSpeed').value || "12.0";
            const damage = document.getElementById('toolDamage').value || "8.0";
            const durability = document.getElementById('toolDurability').value || "2048";
            const level = document.getElementById('toolLevel').value || "4";
            const selectedTools = Array.from(document.getElementById('toolTypeList').selectedOptions).map(o => `GTToolType.${o.value}`);
            const typesStr = kjs ? `[${selectedTools.join(', ')}]` : `new GTToolType[]{${selectedTools.join(', ')}}`;

            sb += `${indent}.toolStats(ToolProperty.Builder.of(${speed}, ${damage}, ${durability}, ${level}, ${typesStr})`;
            if (document.getElementById('toolUnbreakable').checked) sb += `\n${indent}${indent}.unbreakable()`;
            if (document.getElementById('toolMagnetic').checked) sb += `\n${indent}${indent}.magnetic()`;
            sb += `\n${indent}${indent}.build())\n`;
        }

        // Final Flags
        const flagList = document.getElementById('flagList');
        const selectedFlags = Array.from(flagList.selectedOptions).map(o => (kjs ? "GTMaterialFlags." : "") + o.value);
        if (selectedFlags.length > 0) sb += `${indent}.flags(${selectedFlags.join(', ')})\n`;

        if (!kjs) sb += `${indent}.buildAndRegister();`;

        materialOutput.textContent = sb;
        if (langOutput) langOutput.value = `addMaterialLang(provider, "${id}", "${name}");`;
    }

    // --- UTILITIES ---
    const addSymbolBtn = document.getElementById('addSymbol');
    if (addSymbolBtn) {
        addSymbolBtn.onclick = () => {
            nameField.value += '§';
            navigator.clipboard.writeText('§');
            updateCode();
        };
    }

    const aquaBtn = document.getElementById('quickAqua');
    if (aquaBtn) {
        aquaBtn.onclick = () => {
            if (!nameField.value.startsWith('§b')) {
                nameField.value = '§b' + nameField.value;
                updateCode();
            }
        };
    }

    const themePicker = document.getElementById('themePicker');
    if (themePicker) {
        themePicker.onchange = (e) => {
            document.body.classList.forEach(c => { if(c.startsWith('theme-')) document.body.classList.remove(c); });
            if(e.target.value !== 'default') document.body.classList.add(`theme-${e.target.value}`);
        };
    }

    // Global listener for architect updates
    document.addEventListener('input', updateCode);

    // Initial Run
    updateCode();
});

// --- TEXTURE LAB GLOBALS (Defined outside for access) ---
let layers = [];
const canvas = document.getElementById('phoenixCanvas');

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