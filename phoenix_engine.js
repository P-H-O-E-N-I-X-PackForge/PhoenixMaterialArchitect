// ═══════════════════════════════════════════════
// DATA & CONSTANTS
// ═══════════════════════════════════════════════
let recipes = (typeof BASE_RECIPES !== 'undefined') ? [...BASE_RECIPES] : [];
let editingId = null;
let customMachines = [];
let emiRecipes = [];
let emiIdx = 0;

// User preferences for which recipe to use for a given item (itemId -> recipeId)
let recipeChoices = {};
// Items the user wants to treat as passive/raw (won't be auto-resolved)
let passiveNodes = new Set();
// Calculation mode: 'rate' = per-second target, 'once' = single craft
let calcMode = 'rate';

const TIER_EUT = {ULV:8,LV:32,MV:128,HV:512,EV:2048,IV:8192,LuV:32768,ZPM:131072,UV:524288};
const TIER_ORDER = ['ULV','LV','MV','HV','EV','IV','LuV','ZPM','UV'];

const BUILTIN_MACHINES = [
    'Electric Blast Furnace','Alloy Smelter','Alloy Blast Smelter','Assembly Line',
    'Assembler','Chemical Reactor','Large Chemical Reactor','Electrolyzer','Centrifuge',
    'Macerator','Ore Washer','Thermal Centrifuge','Circuit Assembler','Autoclave',
    'Compressor','Extractor','Extruder','Fluid Solidifier','Forming Press','Lathe',
    'Wire Mill','Polarizer','Bender','Cutter','Electromagnetic Separator','Sifter',
    'Mixer','Distillery','Distillation Tower','Pyrolyse Oven','Vacuum Freezer',
    'Fusion Reactor','Implosion Compressor','Scanner','Forge Hammer','Ember Igniter',
    'Earth Sieve','Water Source','Confectionery Fabricator','Source Imbuement',
    'Source Extraction','Source Reactor','Bio Aetheric Engine','Comb Decanter',
    'Apis Progenitor','Honey Chamber','Phoenixware Fusion MK1','Custom / Other'
];

const JAVA_MAP = {
    ASSEMBLER_RECIPES:'Assembler',ASSEMBLY_LINE_RECIPES:'Assembly Line',
    BLAST_RECIPES:'Electric Blast Furnace',EBF_RECIPES:'Electric Blast Furnace',
    ELECTRIC_BLAST_FURNACE_RECIPES:'Electric Blast Furnace',
    CENTRIFUGE_RECIPES:'Centrifuge',CHEMICAL_RECIPES:'Chemical Reactor',
    LARGE_CHEMICAL_RECIPES:'Large Chemical Reactor',
    CIRCUIT_ASSEMBLER_RECIPES:'Circuit Assembler',COMPRESSOR_RECIPES:'Compressor',
    DISTILLATION_RECIPES:'Distillation Tower',ELECTROLYZER_RECIPES:'Electrolyzer',
    EXTRACTOR_RECIPES:'Extractor',FLUID_SOLIDIFICATION_RECIPES:'Fluid Solidifier',
    FORMING_PRESS_RECIPES:'Forming Press',IMPLOSION_RECIPES:'Implosion Compressor',
    LATHE_RECIPES:'Lathe',MACERATOR_RECIPES:'Macerator',MIXER_RECIPES:'Mixer',
    SCANNER_RECIPES:'Scanner',SIFTER_RECIPES:'Sifter',
    VACUUM_FREEZER_RECIPES:'Vacuum Freezer',WIREMILL_RECIPES:'Wire Mill',
    ALLOY_BLAST_SMELTER_RECIPES:'Alloy Blast Smelter',
    APIS_PROGENITOR_RECIPES:'Apis Progenitor',SOURCE_REACTOR_RECIPES:'Source Reactor',
    BIO_ENGINE_RECIPES:'Bio Aetheric Engine',HONEY_CHAMBER_RECIPES:'Honey Chamber',
    SOURCE_IMBUEMENT_RECIPES:'Source Imbuement',SOURCE_EXTRACTION_RECIPES:'Source Extraction',
    COMB_DECANTING_RECIPES:'Comb Decanter',
};

// ═══════════════════════════════════════════════
// INIT & STORAGE
// ═══════════════════════════════════════════════
window.onload = () => {
    try {
        const sR = localStorage.getItem('pcR'); if(sR) recipes = JSON.parse(sR);
        const sC = localStorage.getItem('pcCM'); if(sC) customMachines = JSON.parse(sC);
        const sCh = localStorage.getItem('pcCH'); if(sCh) recipeChoices = JSON.parse(sCh);
        const sP = localStorage.getItem('pcP'); if(sP) passiveNodes = new Set(JSON.parse(sP));
    } catch(e) { console.error("Storage load failed", e); }

    populateMSel();
    renderCMList();
    renderList();
    updateOCPreview();
    console.log("Phoenix Engine Initialized");
};

function dbSave(){ localStorage.setItem('pcR',JSON.stringify(recipes)); }
function cmSave(){ localStorage.setItem('pcCM',JSON.stringify(customMachines)); }
function choiceSave(){ localStorage.setItem('pcCH',JSON.stringify(recipeChoices)); }
function passiveSave(){ localStorage.setItem('pcP',JSON.stringify([...passiveNodes])); }
function allMachines(){ return [...BUILTIN_MACHINES,...customMachines]; }

function populateMSel(){
    const s = document.getElementById('rMachine');
    if(!s) return;
    const prev = s.value;
    s.innerHTML = allMachines().map(m=>`<option value="${m}">${m}</option>`).join('');
    if(prev) s.value = prev;
}

// ═══════════════════════════════════════════════
// CUSTOM MACHINES
// ═══════════════════════════════════════════════
function addCM(){
    const v = (document.getElementById('cmInput')?.value || '').trim();
    if(!v || customMachines.includes(v) || BUILTIN_MACHINES.includes(v)){ notify('Already exists or empty.'); return; }
    customMachines.push(v); cmSave(); populateMSel(); renderCMList();
    if(document.getElementById('cmInput')) document.getElementById('cmInput').value = '';
    notify('Machine added: ' + v);
}
function removeCM(name){
    customMachines = customMachines.filter(m=>m!==name); cmSave(); populateMSel(); renderCMList();
}
function renderCMList(){
    const el = document.getElementById('cmList');
    if(!el) return;
    if(!customMachines.length){ el.innerHTML = '<span style="font-size:9px">None added.</span>'; return; }
    el.innerHTML = customMachines.map(m=>`
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">
                <span>${m}</span>
                <button class="btn btn-sm btn-d" style="padding:1px 5px;font-size:8px" onclick="removeCM('${m.replace(/'/g,"\\'")}')">×</button>
            </div>`).join('');
}

// ═══════════════════════════════════════════════
// OVERCLOCK ENGINE
// ═══════════════════════════════════════════════
function ocCalc(recipe, machineTierName, ocType){
    if(!machineTierName || machineTierName === '0') return {eut:recipe.eut||0, duration:recipe.duration||200, ocLevels:0};
    const recipeTier = eutToTier(recipe.eut||0);
    const recipeIdx  = TIER_ORDER.indexOf(recipeTier);
    const machineIdx = TIER_ORDER.indexOf(machineTierName);
    if(machineIdx <= recipeIdx) return {eut:recipe.eut||0, duration:recipe.duration||200, ocLevels:0};

    const levels = machineIdx - recipeIdx;
    let eut = recipe.eut||0;
    let dur = recipe.duration||200;

    for(let i=0; i<levels; i++){
        if(ocType === 'perfect'){
            // Perfect OC: 4x EUt, 1/4 duration (same throughput improvement)
            eut = eut * 4;
            dur = Math.max(1, Math.floor(dur / 4));
        } else {
            // Normal (Imperfect) OC: 4x EUt, 1/2 duration
            eut = eut * 4;
            dur = Math.max(1, Math.floor(dur / 2));
        }
    }
    return {eut, duration:dur, ocLevels:levels};
}

function updateOCPreview(){
    const tier = document.getElementById('ocTier')?.value;
    const type = document.getElementById('ocType')?.value;
    const el = document.getElementById('ocPreview');
    if(!el) return;
    if(!tier || tier === '0'){ el.textContent = 'Machine counts use base recipe speed'; return; }
    const label = type === 'perfect' ? '4× EUt, ¼ dur' : '4× EUt, ½ dur';
    el.textContent = `EMI preview: ${tier} ${type} OC (${label}) — counts always use base speed`;
}

// ═══════════════════════════════════════════════
// RECIPE LIST
// ═══════════════════════════════════════════════
function renderList(){
    const q = (document.getElementById('searchBox')?.value || '').toLowerCase();
    const countEl = document.getElementById('rcCount');
    if(countEl) countEl.textContent = recipes.length;
    updateSugs();

    const f = recipes.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.machine.toLowerCase().includes(q) ||
        (r.outputs||[]).some(o => o.item.toLowerCase().includes(q)) ||
        (r.inputs||[]).some(i => i.item.toLowerCase().includes(q))
    );

    const listEl = document.getElementById('recipeList');
    if(!listEl) return;
    if(!f.length){
        listEl.innerHTML = `<div class="empty"><div class="empty-icon">⚙</div><div class="empty-text">${recipes.length === 0 ? 'No recipes yet.<br>Add or import.' : 'No matches.'}</div></div>`;
        return;
    }
    listEl.innerHTML = f.map(r => `
            <div class="recipe-card" onclick="openEdit('${r.id}')">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
                <div class="r-name">${r.name}</div>
                <span class="tier tier-${r.tier||'LV'}">${r.tier||'LV'}</span>
              </div>
              <div class="r-meta">${r.machine} · ${r.eut||0} EU/t · ${r.duration||0}t${r.blastTemp ? ` · 🔥${r.blastTemp}K` : ''}${r.circuit != null ? ` · ◈${r.circuit}` : ''}</div>
              <div class="chips">
                ${(r.outputs||[]).map(o => `<span class="chip chip-o">▶ ${o.qty}x ${o.item}</span>`).join('')}
                ${(r.inputs||[]).map(i => `<span class="chip chip-i">◀ ${i.qty}x ${i.item}</span>`).join('')}
                ${(r.fluidInputs||[]).map(fi => `<span class="chip chip-fi">≋ ${fi.qty}mB ${fi.item}</span>`).join('')}
                ${(r.fluidOutputs||[]).map(fo => `<span class="chip chip-fo">≋▶ ${fo.qty}mB ${fo.item}</span>`).join('')}
              </div>
            </div>`).join('');
}

function updateSugs(){
    const items = new Set();
    recipes.forEach(r => {
        (r.outputs||[]).forEach(o => items.add(o.item));
        (r.fluidOutputs||[]).forEach(f => items.add(f.item + ' (fluid)'));
    });
    const sugEl = document.getElementById('itemSugs');
    if(sugEl) sugEl.innerHTML = [...items].map(i => `<option value="${i}">`).join('');
}

// ═══════════════════════════════════════════════
// ADD / EDIT
// ═══════════════════════════════════════════════
function openAdd(){
    editingId = null;
    document.getElementById('addTitle').textContent = 'Add Recipe';
    document.getElementById('delBtn').style.display = 'none';
    ['rName','rEut','rDuration','rBlast','rCircuit','rNC','rFusion'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    });
    document.getElementById('rParallels').value = '1';
    document.getElementById('rMachine').value = 'Electric Blast Furnace';
    document.getElementById('rTier').value = 'MV';
    ['outEd','inEd','fiEd','foEd','chEd','ciEd','condEd','dataEd'].forEach(id => {
        const el = document.getElementById(id); if(el) el.innerHTML = '';
    });
    addIO('outEd','out'); addIO('inEd','in');
    document.getElementById('addModal').classList.add('open');
}

function openEdit(id){
    const r = recipes.find(x => x.id === id); if(!r) return;
    editingId = id;
    document.getElementById('addTitle').textContent = 'Edit Recipe';
    document.getElementById('delBtn').style.display = 'block';
    document.getElementById('rName').value = r.name || '';
    document.getElementById('rMachine').value = r.machine || 'Electric Blast Furnace';
    document.getElementById('rTier').value = r.tier || 'LV';
    document.getElementById('rEut').value = r.eut || '';
    document.getElementById('rDuration').value = r.duration || '';
    document.getElementById('rParallels').value = r.parallels || 1;
    document.getElementById('rCircuit').value = r.circuit != null ? r.circuit : '';
    document.getElementById('rBlast').value = r.blastTemp || '';
    document.getElementById('rFusion').value = r.fusionStartEU || '';
    document.getElementById('rNC').value = r.notConsumable || '';
    ['outEd','inEd','fiEd','foEd','chEd','ciEd','condEd','dataEd'].forEach(id => {
        const el = document.getElementById(id); if(el) el.innerHTML = '';
    });
    (r.outputs||[]).forEach(o => addIO('outEd','out',o.item,o.qty));
    (r.inputs||[]).forEach(i => addIO('inEd','in',i.item,i.qty));
    (r.fluidInputs||[]).forEach(f => addIO('fiEd','fi',f.item,f.qty));
    (r.fluidOutputs||[]).forEach(f => addIO('foEd','fo',f.item,f.qty));
    (r.chancedOutputs||[]).forEach(c => addChanced(c.item,c.qty,c.chance,c.boost));
    (r.customIngredients||[]).forEach(ci => addCI(ci.role,ci.value,ci.qty));
    (r.conditions||[]).forEach(c => addCond(c.type,c.value));
    (r.addData||[]).forEach(d => addData(d.key,d.value));
    document.getElementById('addModal').classList.add('open');
}

function closeAdd(){ document.getElementById('addModal')?.classList.remove('open'); }

function addIO(edId,type,item='',qty=''){
    const unit = (type === 'fi' || type === 'fo') ? 'mB' : '×';
    const row = document.createElement('div'); row.className = 'io-row';
    row.innerHTML = `<input type="text" class="ii" placeholder="${type === 'fi' || type === 'fo' ? 'fluid_id' : 'item_id'}" value="${item}" style="flex:1;margin:0"><input type="number" class="iq" placeholder="qty" value="${qty}" style="width:58px;margin:0" min="0"><span style="color:var(--text-dim);font-size:9px;width:22px">${unit}</span><button class="btn btn-sm btn-d" style="padding:2px 5px" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById(edId)?.appendChild(row);
}

function addChanced(item='',qty='',chance='',boost=''){
    const row = document.createElement('div'); row.className = 'io-row'; row.style.flexWrap = 'wrap';
    row.innerHTML = `<input type="text" class="ci" placeholder="item_id" value="${item}" style="flex:1;min-width:80px;margin:0"><input type="number" class="cq" placeholder="qty" value="${qty}" style="width:45px;margin:0"><input type="number" class="cc" placeholder="%×100" value="${chance}" style="width:58px;margin:0" title="e.g. 8500=85%"><input type="number" class="cb" placeholder="boost" value="${boost}" style="width:45px;margin:0"><button class="btn btn-sm btn-d" style="padding:2px 5px" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('chEd')?.appendChild(row);
}

function addCI(role='',value='',qty=''){
    const row = document.createElement('div'); row.className = 'kv-row';
    row.innerHTML = `<select style="width:90px;margin:0"><option value="input" ${role === 'input' ? 'selected' : ''}>Input</option><option value="output" ${role === 'output' ? 'selected' : ''}>Output</option><option value="notConsumable" ${role === 'notConsumable' ? 'selected' : ''}>Not Consumed</option></select><input type="text" placeholder="#gtceu:circuits/hv" value="${value}" style="flex:1;margin:0"><input type="number" placeholder="qty" value="${qty}" style="width:50px;margin:0" min="0"><button class="btn btn-sm btn-d" style="padding:2px 5px" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('ciEd')?.appendChild(row);
}

function addCond(type='',value=''){
    const row = document.createElement('div'); row.className = 'kv-row';
    row.innerHTML = `<select style="width:110px;margin:0"><option value="cleanroom" ${type === 'cleanroom' ? 'selected' : ''}>Cleanroom</option><option value="dimension" ${type === 'dimension' ? 'selected' : ''}>Dimension</option><option value="soul" ${type === 'soul' ? 'selected' : ''}>Soul Condition</option><option value="blast_temp" ${type === 'blast_temp' ? 'selected' : ''}>Blast Temp Min</option><option value="custom" ${type === 'custom' ? 'selected' : ''}>Custom</option></select><input type="text" placeholder="value" value="${value}" style="flex:1;margin:0"><button class="btn btn-sm btn-d" style="padding:2px 5px" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('condEd')?.appendChild(row);
}

function addData(key='',value=''){
    const row = document.createElement('div'); row.className = 'kv-row';
    row.innerHTML = `<input type="text" placeholder="key" value="${key}" style="flex:1;margin:0"><input type="text" placeholder="value" value="${value}" style="flex:1;margin:0"><button class="btn btn-sm btn-d" style="padding:2px 5px" onclick="this.parentElement.remove()">×</button>`;
    document.getElementById('dataEd')?.appendChild(row);
}

function readIO(edId){
    return [...document.querySelectorAll(`#${edId} .io-row`)].map(row => {
        const item = row.querySelector('.ii').value.trim().toLowerCase().replace(/\s+/g,'_');
        const qty = parseFloat(row.querySelector('.iq').value) || 0;
        return (item && qty > 0) ? {item, qty} : null;
    }).filter(Boolean);
}
function readChanced(){
    return [...document.querySelectorAll('#chEd .io-row')].map(row => {
        const item = row.querySelector('.ci').value.trim().toLowerCase().replace(/\s+/g,'_');
        const qty = parseFloat(row.querySelector('.cq').value) || 0;
        const chance = parseInt(row.querySelector('.cc').value) || 0;
        const boost = parseInt(row.querySelector('.cb').value) || 0;
        return item ? {item, qty, chance, boost} : null;
    }).filter(Boolean);
}
function readCI(){
    return [...document.querySelectorAll('#ciEd .kv-row')].map(row => {
        const selects = row.querySelectorAll('select'); const inputs = row.querySelectorAll('input');
        return {role:selects[0].value, value:inputs[0].value.trim(), qty:parseFloat(inputs[1].value) || 1};
    }).filter(c => c.value);
}
function readCond(){
    return [...document.querySelectorAll('#condEd .kv-row')].map(row => {
        const selects = row.querySelectorAll('select'); const inputs = row.querySelectorAll('input');
        return {type:selects[0].value, value:inputs[0].value.trim()};
    }).filter(c => c.value || c.type !== 'custom');
}
function readData(){
    return [...document.querySelectorAll('#dataEd .kv-row')].map(row => {
        const inputs = row.querySelectorAll('input');
        return {key:inputs[0].value.trim(), value:inputs[1].value.trim()};
    }).filter(d => d.key);
}

function saveRecipe(){
    const name = document.getElementById('rName').value.trim();
    if(!name){ notify('Recipe name required.'); return; }
    const outputs = readIO('outEd');
    if(!outputs.length){ notify('At least one output required.'); return; }

    const r = {
        id: editingId || ('r_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
        name, machine: document.getElementById('rMachine').value,
        tier: document.getElementById('rTier').value,
        eut: parseFloat(document.getElementById('rEut').value) || 0,
        duration: parseFloat(document.getElementById('rDuration').value) || 1,
        parallels: parseInt(document.getElementById('rParallels').value) || 1,
        outputs, inputs: readIO('inEd'),
        fluidOutputs: readIO('foEd'), fluidInputs: readIO('fiEd'),
        chancedOutputs: readChanced(), customIngredients: readCI(),
        conditions: readCond(), addData: readData(),
    };
    const circ = document.getElementById('rCircuit').value.trim();
    if(circ !== '') r.circuit = parseInt(circ);
    const blast = document.getElementById('rBlast').value.trim();
    if(blast !== '') r.blastTemp = parseInt(blast);
    const fusion = document.getElementById('rFusion').value.trim();
    if(fusion !== '') r.fusionStartEU = parseInt(fusion);
    const nc = document.getElementById('rNC').value.trim();
    if(nc !== '') r.notConsumable = nc;

    if(editingId){ const idx = recipes.findIndex(x => x.id === editingId); if(idx >= 0) recipes[idx] = r; }
    else recipes.push(r);
    dbSave(); renderList(); closeAdd();
    notify(editingId ? 'Recipe updated.' : 'Recipe added.');
}

function deleteRecipe(){
    if(!editingId) return;
    recipes = recipes.filter(r => r.id !== editingId);
    dbSave(); renderList(); closeAdd(); notify('Deleted.');
}

// ═══════════════════════════════════════════════
// CALCULATOR CORE
// ═══════════════════════════════════════════════
let lastTree = null;

function calculate(){
    try {
        const targetEl = document.getElementById('targetItem');
        const qtyEl = document.getElementById('targetQty');
        const unitEl = document.getElementById('targetUnit');
        if(!targetEl || !qtyEl) return;

        const rawTarget = targetEl.value.trim();
        const isFluid = rawTarget.endsWith('(fluid)');
        const target = rawTarget.replace(' (fluid)','').toLowerCase().replace(/\s+/g,'_');

        const rawQty = parseFloat(qtyEl.value) || 1;

        if(!target){ notify('Enter a target item.'); return; }
        if(!recipes.length){ notify('No recipes in database.'); return; }

        const ocTier = document.getElementById('ocTier')?.value || '0';
        const ocType = document.getElementById('ocType')?.value || 'normal';

        let qtyPerSec;
        if(calcMode === 'once'){
            // Single craft mode: resolve exactly 1 craft, don't scale by time
            qtyPerSec = null; // signals single-craft mode
        } else {
            const unitMult = parseFloat(unitEl?.value || "1");
            qtyPerSec = rawQty / unitMult;
        }

        const rawMats = new Map();
        const steps = [];
        lastTree = resolve(target, qtyPerSec, rawMats, steps, new Set(), 0, ocTier, ocType, isFluid);

        renderResults(target, qtyPerSec, rawMats, steps, lastTree);
        renderProductionLine(steps, ocTier, ocType);
    } catch(e) { console.error("Calculation failed", e); notify("Error during calculation. Check console."); }
}

function findAllRecipes(item, isFluid = false){
    let found = [];
    if(isFluid){
        found = recipes.filter(r => (r.fluidOutputs||[]).some(f => f.item === item) || (r.outputs||[]).some(o => o.item === item));
    } else {
        found = recipes.filter(r => (r.outputs||[]).some(o => o.item === item) || (r.fluidOutputs||[]).some(f => f.item === item));
    }

    // Add virtuals if nothing found or if specifically requested
    const virtuals = getVirtualRecipes(item);
    found = [...found, ...virtuals];

    return found;
}

function findRecipe(item, isFluid = false){
    const all = findAllRecipes(item, isFluid);
    if(!all.length) return null;

    // If user has a preference, use it
    if(recipeChoices[item]){
        const pref = all.find(r => r.id === recipeChoices[item]);
        if(pref) return pref;
    }

    // Default: return first one
    return all[0];
}

function resolve(item, qtyPerSec, rawMats, steps, visited, depth, ocTier, ocType, isFluid = false){
    // Check if this item is marked passive — treat as raw regardless
    if(passiveNodes.has(item)){
        const label = item + (isFluid ? ' (fluid)' : '') + ' [passive]';
        if(qtyPerSec !== null) rawMats.set(label, (rawMats.get(label) || 0) + qtyPerSec);
        return {item, qty: qtyPerSec, isRaw: true, isPassive: true, children: []};
    }

    let recipe = findRecipe(item, isFluid);

    if(!recipe || depth > 30){
        const label = item + (isFluid ? ' (fluid)' : '');
        if(qtyPerSec !== null) rawMats.set(label, (rawMats.get(label) || 0) + qtyPerSec);
        return {item, qty: qtyPerSec, isRaw: true, children: []};
    }
    if(visited.has(item)){
        const label = item + (isFluid ? ' (fluid)' : '');
        if(qtyPerSec !== null) rawMats.set(label, (rawMats.get(label) || 0) + qtyPerSec);
        return {item, qty: qtyPerSec, isRaw: true, isCycle: true, children: []};
    }
    visited.add(item);

    // Machine speed is always the recipe's base tier — no OC applied to throughput.
    // A recipe runs at its native speed; you just build more machines to meet demand.
    const effEut = recipe.eut || 0;
    const effDur = recipe.duration || 200;
    const oc = {ocLevels: 0, eut: effEut, duration: effDur};

    const outEntry = isFluid
        ? (recipe.fluidOutputs||[]).find(f => f.item === item) || (recipe.outputs||[]).find(o => o.item === item)
        : (recipe.outputs||[]).find(o => o.item === item) || (recipe.fluidOutputs||[]).find(f => f.item === item);

    if(!outEntry){
        const label = item + (isFluid ? ' (fluid)' : '');
        if(qtyPerSec !== null) rawMats.set(label, (rawMats.get(label) || 0) + qtyPerSec);
        visited.delete(item);
        return {item, qty: qtyPerSec, isRaw: true, children: []};
    }

    const parallels = recipe.parallels || 1;
    const outPerCycle = outEntry.qty * parallels;
    const durSec = effDur / 20;

    // --- Fractional machine calculation ---
    // We NEVER ceiling here. We accumulate pure fractional need across the whole tree,
    // and only Math.ceil() at render time in renderProductionLine.
    let needed, isSingleCraft;

    if(qtyPerSec === null){
        needed = 1;
        isSingleCraft = true;
    } else {
        const outPerSec = outPerCycle / durSec;
        needed = qtyPerSec / outPerSec; // exact fractional machines required
        isSingleCraft = false;
    }

    // EU/t should be fractional too (real cost = fraction of machine running)
    const fracEut = effEut * needed;

    const rid = recipe.id || ('v_' + item);
    const ex = steps.find(s => s.recipeId === rid);
    if(ex){
        ex.neededFractional += needed;   // accumulate pure fraction
        ex.totalEut += fracEut;
        if(!ex.producing.includes(item)) ex.producing.push(item);
    } else {
        steps.push({recipeId:rid, recipe, neededFractional:needed, totalEut:fracEut, producing:[item], ocLevels:oc.ocLevels, effEut, effDur, isSingleCraft});
    }

    // Propagate inputs scaled by fractional machines (not ceiling)
    const itemChildren = (recipe.inputs || []).map(inp => {
        const inpQty = isSingleCraft
            ? inp.qty * parallels
            : (inp.qty * parallels / durSec) * needed;
        return resolve(inp.item, inpQty || null, rawMats, steps, new Set(visited), depth + 1, ocTier, ocType, false);
    });

    const fluidChildren = (recipe.fluidInputs || []).map(f => {
        const fQty = isSingleCraft
            ? f.qty * parallels
            : (f.qty * parallels / durSec) * needed;
        return resolve(f.item, fQty || null, rawMats, steps, new Set(visited), depth + 1, ocTier, ocType, true);
    });

    visited.delete(item);
    const count = Math.ceil(needed);
    const util = needed > 0 ? ((needed / count) * 100).toFixed(1) : '100.0';
    return {item, qty: qtyPerSec, recipe, needed, count, util, children: [...itemChildren, ...fluidChildren], isRaw: false, ocLevels: oc.ocLevels, isSingleCraft};
}

function renderResults(target, qty, rawMats, steps, tree){
    const resArea = document.getElementById('resultsArea');
    if(!resArea) return;

    const modeLabel = qty === null ? `1× craft of ${target}` : `${fmt(qty)}/s ${target}`;
    let html = `<div class="result-section">
            <div class="sec-title" style="display:flex;align-items:center;gap:8px">
                Production Chain — ${modeLabel}
                <span style="font-size:8px;color:var(--text-dim);margin-left:auto">Right-click a node to toggle passive</span>
            </div>
            ${renderTree(tree, 0)}
        </div>
        <div class="result-section">
            <div class="sec-title">Raw Material Requirements</div>
            <table class="mat-table">
                <thead><tr><th>Material</th><th style="text-align:right">${qty === null ? 'per craft' : 'per second'}</th>${qty !== null ? '<th style="text-align:right">per minute</th>' : ''}</tr></thead>
                <tbody>`;
    rawMats.forEach((q, item) => {
        const fl = item.includes('(fluid)');
        const passive = item.includes('[passive]');
        html += `<tr><td>${fl ? '<span style="color:var(--accent)">≋</span> ' : ''}${passive ? '<span style="color:var(--purple)" title="Passive/external supply">⟳</span> ' : ''}${item.replace(' [passive]','')}</td>
                <td style="text-align:right;color:var(--yellow);font-weight:700">${q === null ? '—' : fmt(q)}</td>
                ${qty !== null ? `<td style="text-align:right;color:var(--orange);font-weight:700">${q === null ? '—' : fmt(q*60)}</td>` : ''}
            </tr>`;
    });
    html += `</tbody></table></div>`;
    resArea.innerHTML = html;
}

function renderTree(node, depth){
    if(!node) return '';
    let pad = '';
    for(let d=0; d < depth-1; d++) pad += '\u2502  ';
    if(depth > 0) pad += '\u251c\u2500 ';
    const oc = (!node.isRaw && node.ocLevels > 0) ? `<span style="background:var(--accent-dim);color:var(--accent);font-size:8px;padding:1px 3px;border-radius:3px">OC+${node.ocLevels}</span>` : '';
    const ienc = encodeURIComponent(node.item || '');
    const isPassive = passiveNodes.has(node.item);

    // Check for multiple recipes
    const all = findAllRecipes(node.item, node.item.includes('(fluid)'));
    const hasOptions = all.length > 1;

    const qtyStr = node.qty === null ? (node.isSingleCraft ? '1× craft' : '1×') : `${fmt(node.qty)}/s`;

    let html = `<div class="chain-node">
            <div class="chain-row${isPassive ? ' passive-node' : ''}" 
                data-item="${ienc}" 
                data-raw="${node.isRaw?'1':'0'}"
                onclick="handleNodeClick(event, this)"
                oncontextmenu="togglePassive(event, '${node.item.replace(/'/g,"\\'")}')">
                <span style="color:#444;font-size:10px;white-space:pre">${pad}</span>
                <span style="flex:1;color:${isPassive ? 'var(--purple)' : 'var(--text-bright)'};overflow:hidden;text-overflow:ellipsis">${node.item}</span>
                <span style="color:var(--yellow);font-weight:700;margin:0 8px">${qtyStr}</span>`;
    if(node.isPassive){
        html += `<span style="color:var(--purple);font-size:9px">PASSIVE</span>`;
    } else if(node.isRaw){
        html += `<span style="color:var(--orange);font-size:9px">${node.isCycle?'CYCLE':'RAW'}</span>`;
    } else {
        const multiBadge = hasOptions ? `<span style="color:var(--green);font-size:8px;margin-right:4px;border:1px solid;padding:0 2px;border-radius:3px" title="Multiple recipes available">ALT</span>` : '';
        const countStr = node.isSingleCraft ? `×1` : `×${node.count}`;
        const utilStr = node.isSingleCraft ? '' : ` <span style="color:#555">(${node.util}%)</span>`;
        html += `<span style="color:var(--text-dim);font-size:9px">${multiBadge}${node.recipe.machine} ${countStr}${utilStr} ${oc}</span>`;
    }
    html += `</div>`;
    if(node.children && node.children.length){
        html += `<div style="margin-left:14px;margin-top:2px">${node.children.map(ch => renderTree(ch, depth + 1)).join('')}</div>`;
    }
    return html + `</div>`;
}

function togglePassive(e, item){
    e.preventDefault();
    if(passiveNodes.has(item)){
        passiveNodes.delete(item);
        notify(`Removed passive: ${item}`);
    } else {
        passiveNodes.add(item);
        notify(`Marked passive: ${item} — will be treated as external supply`);
    }
    passiveSave();
    calculate();
}

function handleNodeClick(e, el){
    const item = decodeURIComponent(el.getAttribute('data-item') || '');
    const isRaw = el.getAttribute('data-raw') === '1';

    if(isRaw){
        notify('Raw Material: ' + item);
        return;
    }

    const all = findAllRecipes(item, item.includes('(fluid)'));
    if(all.length > 1){
        showRecipePicker(item, all);
    } else {
        emiShow(all, 0);
    }
}

function showRecipePicker(item, all){
    const picker = document.getElementById('recipePickerModal') || createRecipePicker();
    const list = document.getElementById('pickerList');
    list.innerHTML = `<h4>Select Recipe for ${item}</h4>`;

    all.forEach(r => {
        const row = document.createElement('div');
        row.className = 'picker-row' + (recipeChoices[item] === r.id ? ' active' : '');
        row.innerHTML = `
                <div style="flex:1">
                    <div style="font-weight:600">${r.name}</div>
                    <div style="font-size:10px;color:var(--text-dim)">${r.machine} · ${r.eut} EU/t</div>
                </div>
                <button class="btn btn-sm btn-p" onclick="selectRecipe('${item}','${r.id}')">Use</button>
            `;
        list.appendChild(row);
    });
    picker.classList.add('open');
}

function selectRecipe(item, rid){
    recipeChoices[item] = rid;
    choiceSave();
    document.getElementById('recipePickerModal').classList.remove('open');
    calculate(); // Recalculate with new preference
}

function createRecipePicker(){
    const div = document.createElement('div');
    div.id = 'recipePickerModal';
    div.className = 'modal-overlay';
    div.innerHTML = `<div class="modal-content" style="max-width:400px"><div id="pickerList"></div><br><button class="btn btn-d" onclick="this.closest('.modal-overlay').classList.remove('open')">Close</button></div>`;
    document.body.appendChild(div);
    div.addEventListener('click', e => { if(e.target === div) div.classList.remove('open'); });
    return div;
}

function renderProductionLine(steps, ocTier, ocType){
    const panel = document.getElementById('productionPanel');
    if(!panel) return;
    if(!steps.length){ panel.innerHTML = '<div class="empty">No machines needed.</div>'; return; }

    // Group by machine+tier, sum fractional needs
    const byMachine = {};
    steps.forEach(s => {
        const key = (s.recipe.machine||'Unknown') + '|' + (s.recipe.tier||'LV');
        if(!byMachine[key]){
            byMachine[key] = {name:s.recipe.machine, tier:s.recipe.tier, neededFrac:0, effEut:s.effEut, items:[]};
        }
        byMachine[key].neededFrac += s.neededFractional;
        s.producing.forEach(p => { if(!byMachine[key].items.includes(p)) byMachine[key].items.push(p); });
    });

    // Ceiling fractionals → integer counts, compute real EU/t (ceiled machines × effEut)
    const groups = Object.values(byMachine).map(g => {
        const count = Math.ceil(g.neededFrac);
        const utilPct = g.neededFrac > 0 ? ((g.neededFrac / count) * 100).toFixed(1) : '100.0';
        const eut = g.effEut * count;
        return {...g, count, utilPct, eut};
    }).sort((a,b) => b.eut - a.eut);

    const totalEut = groups.reduce((s, g) => s + g.eut, 0);

    let html = `<div class="eu-sum">
            <div style="font-size:22px;font-weight:700;color:var(--orange)">${fmtEU(totalEut)} EU/t</div>
            <div style="font-size:9px;color:var(--text-dim);letter-spacing:1px">TOTAL POWER DRAW</div>
            <div style="font-size:9px;color:var(--text-dim)">${fmtEU(totalEut*20)} EU/s · ${fmtEU(totalEut*72000)} EU/h</div>
        </div>`;

    groups.forEach(g => {
        const utilVal = parseFloat(g.utilPct);
        const utilColor = utilVal > 90 ? 'var(--green)' : utilVal > 60 ? 'var(--yellow)' : 'var(--orange)';
        html += `<div class="machine-row">
                <div style="font-size:20px;font-weight:700;color:var(--accent);min-width:36px">${g.count}</div>
                <div style="flex:1">
                    <div style="font-weight:600;color:var(--text-bright)">${g.name}</div>
                    <div style="font-size:9px;color:var(--text-dim)"><span class="tier tier-${g.tier}">${g.tier}</span> ${g.items.join(', ')}</div>
                    <div style="font-size:9px;margin-top:2px">
                        <span style="color:${utilColor}">${g.utilPct}% util</span>
                        <span style="color:var(--text-dim)"> · ${g.neededFrac.toFixed(3)} ideal</span>
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="color:var(--orange);font-size:11px;font-weight:600">${fmtEU(g.eut)}</div>
                    <div style="font-size:9px;color:var(--text-dim)">EU/t</div>
                </div>
            </div>`;
    });
    panel.innerHTML = html;
}

// ═══════════════════════════════════════════════
// UTILS & HELPERS
// ═══════════════════════════════════════════════
function eutToTier(e){
    if(e<=8)return'ULV'; if(e<=32)return'LV'; if(e<=128)return'MV';
    if(e<=512)return'HV'; if(e<=2048)return'EV'; if(e<=8192)return'IV';
    if(e<=32768)return'LuV'; if(e<=131072)return'ZPM'; return'UV';
}
function fmt(n){
    if(!n || isNaN(n)) return '0';
    if(n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if(n >= 1e3) return (n/1e3).toFixed(2) + 'k';
    if(n < 0.01 && n > 0) return n.toExponential(2);
    return parseFloat(n.toFixed(3)).toString();
}
function fmtEU(n){
    if(n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if(n >= 1e3) return (n/1e3).toFixed(1) + 'k';
    return Math.round(n).toLocaleString();
}
function notify(msg){
    const el = document.getElementById('notif');
    if(!el){ console.log("Notify: " + msg); return; }
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
}
function cleanId(r){ return (r||'').replace(/.*:/,'').trim().toLowerCase().replace(/\s+/g,'_'); }

function getVirtualRecipes(itemId){
    // Try all naming variants for material recipes
    const patterns = [
        { s: '_plate', n: 'Plate', m: 'Bending Machine', t: 'LV', e: 24, d: 20, i: '_ingot', iq: 1, oq: 1 },
        { s: '_rod', n: 'Rod', m: 'Lathe', t: 'LV', e: 24, d: 16, i: '_ingot', iq: 1, oq: 1 },
        { s: '_rod_long', n: 'Long Rod', m: 'Forge Hammer', t: 'LV', e: 16, d: 32, i: '_rod', iq: 2, oq: 1 },
        { s: '_bolt', n: 'Bolt', m: 'Lathe', t: 'LV', e: 16, d: 8, i: '_rod', iq: 1, oq: 2 },
        { s: '_screw', n: 'Screw', m: 'Lathe', t: 'LV', e: 8, d: 4, i: '_bolt', iq: 1, oq: 1 },
        { s: '_ring', n: 'Ring', m: 'Lathe', t: 'LV', e: 8, d: 4, i: '_rod', iq: 1, oq: 4 },
        { s: '_gear', n: 'Gear', m: 'Extruder', t: 'MV', e: 56, d: 40, i: '_ingot', iq: 4, oq: 1 },
        { s: '_gear_small', n: 'Small Gear', m: 'Extruder', t: 'LV', e: 56, d: 20, i: '_ingot', iq: 1, oq: 1 },
        { s: '_foil', n: 'Foil', m: 'Bender', t: 'LV', e: 24, d: 20, i: '_plate', iq: 1, oq: 4 },
        { s: '_wire_gt_single', n: 'Wire', m: 'Wiremill', t: 'ULV', e: 8, d: 40, i: '_ingot', iq: 1, oq: 2 },
        { s: '_cable_single', n: 'Cable', m: 'Assembler', t: 'ULV', e: 8, d: 100, i: '_wire_gt_single', iq: 1, oq: 1, extraIn: 'rubber_plate' },
        { s: '_pipe_small', n: 'Small Pipe', m: 'Extruder', t: 'MV', e: 56, d: 16, i: '_ingot', iq: 1, oq: 1 },
        { s: '_dust', n: 'Dust', m: 'Macerator', t: 'LV', e: 8, d: 20, i: '_ingot', iq: 1, oq: 1 },
        { s: '_gem', n: 'Gem (Crystallized)', m: 'Autoclave', t: 'LV', e: 24, d: 1200, i: '_dust', iq: 1, oq: 1, fluidIn: 'water', fiq: 250 },
    ];

    // Inverse patterns for names like "long_iron_rod" vs "iron_rod_long"
    let found = [];
    for(let p of patterns){
        let mat = "";
        if(itemId.endsWith(p.s)) mat = itemId.slice(0, -p.s.length);
        else if(itemId.startsWith(p.s.slice(1) + '_')) mat = itemId.slice(p.s.length);

        if(mat){
            const rec = {
                id: 'v_' + itemId + '_' + p.m.replace(/\s/g,''),
                name: `${p.n} for ${mat}`,
                machine: p.m, tier: p.t, eut: p.e, duration: p.d,
                outputs: [{item: itemId, qty: p.oq}],
                inputs: [{item: mat + p.i, qty: p.iq}]
            };
            if(p.extraIn) rec.inputs.push({item: p.extraIn, qty: 1});
            if(p.fluidIn) rec.fluidInputs = [{item: p.fluidIn, qty: p.fiq}];
            found.push(rec);
        }
    }
    return found;
}

function emiShow(list, idx){ emiRecipes = list; emiIdx = idx; renderEMI(); document.getElementById('emiModal')?.classList.add('open'); }
function closeEMI(){ document.getElementById('emiModal')?.classList.remove('open'); }
function emiNav(dir){ emiIdx = Math.max(0, Math.min(emiRecipes.length-1, emiIdx+dir)); renderEMI(); }

function renderEMI(){
    const r = emiRecipes[emiIdx];
    const oc = ocCalc(r, document.getElementById('ocTier')?.value || '0', document.getElementById('ocType')?.value || 'normal');
    const body = document.getElementById('emiBody');
    if(!body) return;

    // Build slot HTML
    function makeSlot(label, qty, type='item', chance=null){
        let cls = 'emi-slot';
        if(type === 'fluid') cls += ' fluid-slot';
        else if(type === 'chanced') cls += ' chanced-slot';
        const abbr = label.replace(/.*:/,'').replace(/_/g,' ').split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,3);
        const abbrColor = type === 'fluid' ? '' : 'dark';
        const qtyDisp = qty > 1 ? qty : '';
        const chanceDisp = chance != null ? `<span class="emi-slot-chance">${(chance/100).toFixed(0)}%</span>` : '';
        return `<div class="${cls}" title="${label}${qty > 1 ? ' ×'+qty : ''}${chance != null ? ' ('+chance/100+'%)' : ''}">
                <span class="emi-slot-abbr ${abbrColor}">${abbr}</span>
                ${qtyDisp ? `<span class="emi-slot-qty">${qtyDisp}</span>` : ''}
                ${chanceDisp}
            </div>`;
    }

    // Inputs: items + fluids
    const allInputs = [...(r.inputs||[]).map(i=>({...i,type:'item'})), ...(r.fluidInputs||[]).map(f=>({...f,type:'fluid'}))];
    const allOutputs = [...(r.outputs||[]).map(o=>({...o,type:'item'})), ...(r.fluidOutputs||[]).map(f=>({...f,type:'fluid'}))];
    const chanced = r.chancedOutputs || [];

    // Lay out in 3-wide grids
    function slotGrid(items, types){
        const rows = [];
        for(let i=0; i<items.length; i+=3){
            const rowItems = items.slice(i, i+3);
            rows.push(`<div class="emi-slot-row">${rowItems.map(it => makeSlot(it.item, it.qty, it.type, it.chance ?? null)).join('')}</div>`);
        }
        return `<div class="emi-slot-grid">${rows.join('')}</div>`;
    }

    const inGrid = allInputs.length ? slotGrid(allInputs) : `<div style="color:#888;font-size:9px;padding:4px">no inputs</div>`;
    const outGrid = [...allOutputs, ...chanced.map(c=>({...c,type:'chanced'}))].length
        ? slotGrid([...allOutputs, ...chanced.map(c=>({...c,type:'chanced'}))])
        : `<div style="color:#888;font-size:9px;padding:4px">no outputs</div>`;

    const tierName = r.tier || 'LV';
    const tierColor = getComputedStyle(document.documentElement).getPropertyValue(`--t-${tierName}`).trim() || '#aaa';
    const nc = r.notConsumable ? `<div style="font-size:9px;color:#888">NC: ${r.notConsumable}</div>` : '';
    const blast = r.blastTemp ? `<div style="font-size:9px;color:#e57373">🔥 ${r.blastTemp}K</div>` : '';
    const circuit = r.circuit != null ? `<div style="font-size:9px;color:#aaa">Circuit #${r.circuit}</div>` : '';

    body.innerHTML = `<div class="emi-wrap">
            <div class="emi-topbar">
                <button class="emi-nav-btn" onclick="emiNav(-1)" ${emiIdx===0?'disabled':''}>◀</button>
                <div class="emi-machine-name">${r.machine}</div>
                <button class="emi-nav-btn" onclick="emiNav(1)" ${emiIdx===emiRecipes.length-1?'disabled':''}>▶</button>
            </div>
            <div class="emi-pagebar">
                <span>Page ${emiIdx+1} of ${emiRecipes.length}</span>
                <span class="emi-tier-pill" style="color:${tierColor};border-color:${tierColor}">${tierName}</span>
            </div>
            <div class="emi-body">
                ${inGrid}
                <div class="emi-arrow-wrap">→</div>
                ${outGrid}
            </div>
            <div class="emi-info-bar">
                <div>Duration: <b>${(oc.duration/20).toFixed(2)}s</b> (${oc.duration}t)${oc.ocLevels > 0 ? ` <span style="color:#888;font-size:9px">OC+${oc.ocLevels}</span>` : ''}</div>
                <div>Usage: <b>${fmtEU(oc.eut)} EU/t</b>${oc.ocLevels > 0 ? ` <span style="color:#888;font-size:9px">(base: ${r.eut} EU/t)</span>` : ''}</div>
                ${blast}${circuit}${nc}
                <div style="font-size:9px;color:#999;margin-top:2px">${r.name}</div>
            </div>
        </div>`;
}