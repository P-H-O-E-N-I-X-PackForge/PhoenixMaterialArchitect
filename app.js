const idField = document.getElementById('idField');
const nameField = document.getElementById('nameField');
const colorField = document.getElementById('colorField');
const ingotCheck = document.getElementById('ingotCheck');
const kubeJSMode = document.getElementById('kubeJSMode');
const materialOutput = document.getElementById('materialOutput');
const langOutput = document.getElementById('langOutput');

function updateCode() {
    const id = idField.value;
    const isKjs = kubeJSMode.checked;
    const indent = "    ";
    let sb = "";

    // Header logic from Java
    if (isKjs) {
        sb += `event.create("${id}")\n`;
    } else {
        sb += `${id.toUpperCase()} = new Material.Builder(PhoenixCore.id("${id}"))\n`;
    }

    // Forms logic
    if (ingotCheck.checked) sb += `${indent}.ingot()\n`;

    // Color logic
    sb += `${indent}.color(0x${colorField.value})\n`;

    // Footer
    if (!isKjs) sb += `${indent}.buildAndRegister();`;

    materialOutput.value = sb;
    langOutput.value = `addMaterialLang(provider, "${id}", "${nameField.value}");`;
}

// Attach listeners (Replacing Java's DocumentListener)
[idField, nameField, colorField, ingotCheck, kubeJSMode].forEach(el => {
    el.addEventListener('input', updateCode);
});

// Run once on load
updateCode();