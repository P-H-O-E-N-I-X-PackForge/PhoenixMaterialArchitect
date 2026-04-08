function updateCode() {
    const id = document.getElementById('idField').value;
    const kjs = document.getElementById('kubeJSMode').checked;
    const name = document.getElementById('nameField').value;
    const indent = "    ";
    let sb = "";


    if (kjs) {
        sb += `event.create("${id}")\n`;
    } else {
        sb += `${id.toUpperCase()} = new Material.Builder(PhoenixCore.id("${id}"))\n`;
    }


    ['ingot', 'dust', 'gem', 'plasma'].forEach(f => {
        if (document.getElementById(f + 'Check').checked) sb += `${indent}.${f}()\n`;
    });

    if (document.getElementById('fluidCheck').checked) {
        sb += kjs ? `${indent}.liquid(new GTFluidBuilder())\n` : `${indent}.fluid()\n`;
    }


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


    if (document.getElementById('enableTools').checked) {
        const speed = document.getElementById('toolSpeed').value || "12.0";
        const damage = document.getElementById('toolDamage').value || "8.0";
        const durability = document.getElementById('toolDurability').value || "2048";
        const level = document.getElementById('toolLevel').value || "4";

        const selectedTools = Array.from(document.getElementById('toolTypeList').selectedOptions)
            .map(o => `GTToolType.${o.value}`);
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


    const bt = parseInt(document.getElementById('bTempField').value);
    if (bt > 0) {
        const gas = document.getElementById('gasBox').value;
        const gasVal = (gas === "null") ? "null" : (kjs ? `GTGasTier.${gas}` : `GasTier.${gas}`);
        const eut = document.getElementById('bEutField').value || "VA[EV]";
        const duration = document.getElementById('bDurationField').value || "1000";

        sb += `${indent}.blastTemp(${bt}, ${gasVal}, GTValues.${eut}, ${duration})\n`;
    }


    if (document.getElementById('enableFluidPipe').checked) {
        const fTemp = document.getElementById('fPipeTemp').value || "1000";
        const fThrough = document.getElementById('fPipeThroughput').value || "128";
        const gasProof = document.getElementById('fGas').checked;
        const acidProof = document.getElementById('fAcid').checked;
        const cryoProof = document.getElementById('fCryo').checked;
        const plasmaProof = document.getElementById('fPlasma').checked;

        sb += `${indent}.fluidPipeProperties(${fTemp}, ${fThrough}, ${gasProof}, ${acidProof}, ${cryoProof}, ${plasmaProof})\n`;
    }


    if (document.getElementById('enableItemPipe').checked) {
        const priority = document.getElementById('itemPriority').value || "1";
        const stacks = document.getElementById('itemStacks').value || "1";
        sb += `${indent}.itemPipeProperties(${priority}, ${stacks})\n`;
    }


    if (document.getElementById('enableCable').checked) {
        const volt = document.getElementById('voltage').value || "HV";
        const amp = document.getElementById('amperage').value || "5";
        const loss = document.getElementById('lossPerBlock').value || "3";
        const supercon = document.getElementById('isSuperconductor').checked;

        sb += `${indent}.cableProperties(GTValues.${volt}, ${amp}, ${loss}, ${supercon})\n`;
    }


    if (document.getElementById('enableRotor').checked) {
        const rPwr = document.getElementById('rotorPower').value || "130";
        const rEff = document.getElementById('rotorEff').value || "115";
        const rDmg = document.getElementById('rotorDamage').value || "3.0";
        const rDur = document.getElementById('rotorDurability').value || "1600";

        sb += `${indent}.rotorStats(${rPwr}, ${rEff}, ${rDmg}F, ${rDur})\n`;
    }


    const selectedFlags = Array.from(document.getElementById('flagList').selectedOptions)
        .map(o => (kjs ? "GTMaterialFlags." : "") + o.value);

    if (selectedFlags.length > 0) {
        sb += `${indent}.flags(${selectedFlags.join(', ')})\n`;
    }


    if (!kjs) {
        sb += `${indent}.buildAndRegister();`;
    }

    document.getElementById('materialOutput').textContent = sb;
    document.getElementById('langOutput').value = `addMaterialLang(provider, "${id}", "${name}");`;
}

document.addEventListener('input', (e) => {
    if (e.target.matches('input, select, textarea')) {
        updateCode();
    }
});

document.getElementById('addSymbol').onclick = () => {
    const nameField = document.getElementById('nameField');
    nameField.value += '§';
    updateCode();
};

document.getElementById('quickAqua').onclick = () => {
    const nameField = document.getElementById('nameField');
    if (!nameField.value.startsWith('§b')) {
        nameField.value = '§b' + nameField.value;
    }
    updateCode();
};
document.getElementById('addSymbol').onclick = () => {
    const nameField = document.getElementById('nameField');
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

updateCode();

document.getElementById('themePicker').onchange = (e) => {
    const theme = e.target.value;

    document.body.classList.forEach(cls => {
        if (cls.startsWith('theme-')) document.body.classList.remove(cls);
    });

    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
};