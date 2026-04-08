import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.TitledBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class PhoenixMaterialArchitect extends JFrame {

    // Global UI
    private final JCheckBox kubeJSMode;
    private final JTextField idField;
    private final JTextField nameField;
    private final JTextField colorField;
    private final JTextField secColorField;
    private final JComboBox<String> iconSetBox;
    private final JCheckBox ingotCheck;
    private final JCheckBox dustCheck;
    private final JCheckBox gemCheck;
    private final JCheckBox fluidCheck;
    private final JCheckBox plasmaCheck;

    // EBF
    private final JTextField bTempField;
    private final JTextField bDurationField;
    private final JTextField bEutField;
    private final JComboBox<String> gasBox;

    // Fluid Pipe
    private final JTextField fPipeTemp;
    private final JTextField fPipeThroughput;
    private final JCheckBox fGasProof;
    private final JCheckBox fAcidProof;
    private final JCheckBox fCryoProof;
    private final JCheckBox fPlasmaProof;
    private final JCheckBox enableFluidPipe;

    // Item Pipe
    private final JTextField itemPriority;
    private final JTextField itemStacksPerSec;
    private final JCheckBox enableItemPipe;

    // Rotor
    private final JTextField rotorPower;
    private final JTextField rotorEff;
    private final JTextField rotorDamage;
    private final JTextField rotorDurability;
    private final JCheckBox enableRotor;

    // Cable
    private final JTextField voltage;
    private final JTextField amperage;
    private final JTextField lossPerBlock;
    private final JCheckBox isSuperconductor;
    private final JCheckBox enableCable;



    // Tools
    private final JCheckBox enableTools, toolUnbreakable, toolMagnetic;
    private final JTextField toolSpeed, toolDamage, toolDurability, toolLevel;
    private final JList<String> toolTypeList;

    // Flags
    private final JList<String> flagList;

    private final JTextArea materialOutput, langOutput;

    public PhoenixMaterialArchitect() {
        setTitle("Phoenix Material Architect - Master Tool & Pipe Edition");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(1500, 950);
        setLocationRelativeTo(null);

        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(new EmptyBorder(10, 10, 10, 10));

        // --- LEFT: BASE CONFIG ---
        JPanel leftPanel = new JPanel();
        leftPanel.setLayout(new BoxLayout(leftPanel, BoxLayout.Y_AXIS));
        leftPanel.setPreferredSize(new Dimension(320, 0));

        idField = new JTextField("nebular_gold");
        nameField = new JTextField("Nebular Gold");

        // SYMBOL BUTTONS
        JPanel nameActionPanel = new JPanel(new BorderLayout());
        JButton symbolBtn = new JButton("Add §");
        symbolBtn.addActionListener(e -> nameField.setText(nameField.getText() + "§"));
        nameActionPanel.add(nameField, BorderLayout.CENTER);
        nameActionPanel.add(symbolBtn, BorderLayout.EAST);

        colorField = new JTextField("FFE100");
        secColorField = new JTextField("FFFFFF");
        iconSetBox = new JComboBox<>(new String[]{"METALLIC",
                "SHINY",
                "DULL",
                "METALLIC",
                "MAGNETIC",
                "SHINY",
                "BRIGHT",
                "DIAMOND",
                "EMERALD",
                "RUBY",
                "OPAL",
                "GLASS",
                "NETHERSTAR",
                "FINE",
                "SAND",
                "WOOD",
                "ROUGH",
                "FLINT",
                "LIGNITE",
                "QUARTZ",
                "CERTUS",
                "LAPIS",
                "FLUID",
                "GEM_HORIZONTAL",
                "GEM_VERTICAL"});

        addLabeledField(leftPanel, "Material ID:", idField);
        leftPanel.add(new JLabel("Display Name (Color Codes):")); leftPanel.add(nameActionPanel);
        addLabeledField(leftPanel, "Primary Color:", colorField);
        addLabeledField(leftPanel, "Secondary Color:", secColorField);
        leftPanel.add(new JLabel("Icon Set:")); leftPanel.add(iconSetBox);

        JPanel checkGrid = new JPanel(new GridLayout(0, 2));
        checkGrid.setBorder(new TitledBorder("Forms"));
        ingotCheck = new JCheckBox("Ingot", true); dustCheck = new JCheckBox("Dust");
        gemCheck = new JCheckBox("Gem"); fluidCheck = new JCheckBox("Fluid");
        plasmaCheck = new JCheckBox("Plasma");
        checkGrid.add(ingotCheck); checkGrid.add(dustCheck);
        checkGrid.add(gemCheck); checkGrid.add(fluidCheck);
        checkGrid.add(plasmaCheck);
        leftPanel.add(checkGrid);

        // --- CENTER: PROPERTY TABS ---
        JTabbedPane tabs = new JTabbedPane();

        // Tool Tab (Fixed logic)
        JPanel toolPanel = new JPanel(new BorderLayout(5, 5));
        JPanel toolStatsPanel = new JPanel(new GridLayout(0, 2, 5, 2));
        toolStatsPanel.setBorder(new TitledBorder("Tool Stats"));
        enableTools = new JCheckBox("Enable Tool Properties");
        toolSpeed = new JTextField("12.0");
        toolDamage = new JTextField("8.0");
        toolDurability = new JTextField("2048");
        toolLevel = new JTextField("4");
        toolUnbreakable = new JCheckBox("Unbreakable");
        toolMagnetic = new JCheckBox("Magnetic");

        toolStatsPanel.add(enableTools); toolStatsPanel.add(new JLabel(""));
        toolStatsPanel.add(new JLabel("Harvest Speed (f):")); toolStatsPanel.add(toolSpeed);
        toolStatsPanel.add(new JLabel("Attack Damage (f):")); toolStatsPanel.add(toolDamage);
        toolStatsPanel.add(new JLabel("Durability (int):")); toolStatsPanel.add(toolDurability);
        toolStatsPanel.add(new JLabel("Harvest Level:")); toolStatsPanel.add(toolLevel);
        toolStatsPanel.add(toolUnbreakable); toolStatsPanel.add(toolMagnetic);

        String[] toolTypes = {
                "SWORD",
                "PICKAXE",
                "SHOVEL",
                "AXE",
                "HOE",
                "WRENCH",
                "MINING_HAMMER",
                "SPADE",
                "SAW",
                "MORTAR",
                "WIRE_CUTTER",
                "SCYTHE",
                "KNIFE",
                "BUTCHERY_KNIFE",
                "PLUNGER",
                "HARD_HAMMER",
                "SOFT_MALLET",
                "FILE",
                "SCREWDRIVER",
                "CROWBAR",
                "DRILL_LV",
                "DRILL_MV",
                "DRILL_HV",
                "DRILL_EV",
                "DRILL_IV",
                "CHAINSAW_LV",
                "WRENCH_LV",
                "WRENCH_HV",
                "WRENCH_IV",
                "BUZZSAW",
                "SCREWDRIVER_LV",
                "WIRE_CUTTER_LV",
                "WIRE_CUTTER_HV",
                "WIRE_CUTTER_IV"
        };
        toolTypeList = new JList<>(toolTypes);
        toolTypeList.setSelectionMode(ListSelectionModel.MULTIPLE_INTERVAL_SELECTION);

        toolPanel.add(toolStatsPanel, BorderLayout.NORTH);
        toolPanel.add(new JScrollPane(toolTypeList), BorderLayout.CENTER);
        tabs.addTab("Tools", toolPanel);

        // Fluid Pipe Tab
        JPanel fpPanel = new JPanel(new GridLayout(0, 2, 5, 5));
        enableFluidPipe = new JCheckBox("Enable Fluid Pipe");
        fPipeTemp = new JTextField("1000");
        fPipeThroughput = new JTextField("128");
        fGasProof = new JCheckBox("Gas Proof");
        fAcidProof = new JCheckBox("Acid Proof");
        fCryoProof = new JCheckBox("Cryo Proof");
        fPlasmaProof = new JCheckBox("Plasma Proof");
        fpPanel.add(enableFluidPipe); fpPanel.add(new JLabel(""));
        fpPanel.add(new JLabel("Max Temp (K):")); fpPanel.add(fPipeTemp);
        fpPanel.add(new JLabel("Throughput:")); fpPanel.add(fPipeThroughput);
        fpPanel.add(fGasProof); fpPanel.add(fAcidProof);
        fpPanel.add(fCryoProof); fpPanel.add(fPlasmaProof);
        tabs.addTab("Fluid Pipes", fpPanel);

        // Cable Tab
        JPanel cablePanel = new JPanel(new GridLayout(0, 2, 5, 5));
        enableCable = new JCheckBox("Enable Cable");
        voltage = new JTextField("HV");
        amperage = new JTextField("5");
        lossPerBlock = new JTextField("3");
        isSuperconductor = new JCheckBox("Superconductor");
        cablePanel.add(enableCable); cablePanel.add(new JLabel(""));
        cablePanel.add(new JLabel("Voltage:")); cablePanel.add(voltage);
        cablePanel.add(new JLabel("Amperage:")); cablePanel.add(amperage);
        cablePanel.add(new JLabel("Loss Per Block:")); cablePanel.add(lossPerBlock);
        cablePanel.add(isSuperconductor);
        tabs.addTab("Cables", cablePanel);

        // Item Pipe Tab
        JPanel ipPanel = new JPanel(new GridLayout(0, 2, 5, 5));
        enableItemPipe = new JCheckBox("Enable Item Pipe");
        itemPriority = new JTextField("1");
        itemStacksPerSec = new JTextField("1");
        ipPanel.add(enableItemPipe); ipPanel.add(new JLabel(""));
        ipPanel.add(new JLabel("Priority:")); ipPanel.add(itemPriority);
        ipPanel.add(new JLabel("Stacks Per Sec:")); ipPanel.add(itemStacksPerSec);
        tabs.addTab("Item Pipes", ipPanel);

        // EBF Tab
        JPanel ebf = new JPanel(new GridLayout(0, 2, 5, 5));
        bTempField = new JTextField("0");
        gasBox = new JComboBox<>(new String[]{"null", "LOW", "MID", "HIGH", "HIGHER", "HIGHEST"});
        bEutField = new JTextField("VA[EV]");
        bDurationField = new JTextField("1000");
        ebf.add(new JLabel("Blast Temp (K):")); ebf.add(bTempField);
        ebf.add(new JLabel("Gas Tier:")); ebf.add(gasBox);
        ebf.add(new JLabel("EUt:")); ebf.add(bEutField);
        ebf.add(new JLabel("Duration (Ticks):")); ebf.add(bDurationField);
        tabs.addTab("Blast Furnace", ebf);

        // Rotor Tab
        JPanel rotorPanel = new JPanel(new GridLayout(0, 2, 5, 5));
        enableRotor = new JCheckBox("Enable Rotor");
        rotorPower = new JTextField("130");
        rotorEff = new JTextField("115");
        rotorDamage = new JTextField("3.0");
        rotorDurability = new JTextField("1600");
        rotorPanel.add(enableRotor); rotorPanel.add(new JLabel(""));
        rotorPanel.add(new JLabel("Power:")); rotorPanel.add(rotorPower);
        rotorPanel.add(new JLabel("Eff %:")); rotorPanel.add(rotorEff);
        rotorPanel.add(new JLabel("Damage:")); rotorPanel.add(rotorDamage);
        rotorPanel.add(new JLabel("Durability:")); rotorPanel.add(rotorDurability);
        tabs.addTab("Rotors", rotorPanel);

        // Flags Tab
        flagList = new JList<>(new String[]{
                "GENERATE_PLATE",
                "GENERATE_DENSE",
                "GENERATE_BOLT_SCREW",
                "GENERATE_ROD",
                "GENERATE_LONG_ROD",
                "GENERATE_GEAR",
                "GENERATE_SMALL_GEAR",
                "GENERATE_FRAME",
                "GENERATE_RING",
                "GENERATE_FOIL",
                "GENERATE_SPRING",
                "GENERATE_SPRING_SMALL",
                "GENERATE_FINE_WIRE",
                "GENERATE_ROUND",
                "GENERATE_ROTOR",
                "PHOSPHORESCENT",
                "IS_MAGNETIC",
                "FORCE_GENERATE_BLOCK",
                "EXCLUDE_BLOCK_CRAFTING_RECIPES",
                "EXCLUDE_PLATE_COMPRESSOR_RECIPE",
                "EXCLUDE_BLOCK_CRAFTING_BY_HAND_RECIPES",
                "MORTAR_GRINDABLE",
                "NO_WORKING",
                "NO_SMASHING",
                "NO_SMELTING",
                "NO_ORE_SMELTING",
                "NO_ORE_PROCESSING_TAB",
                "BLAST_FURNACE_CALCITE_DOUBLE",
                "BLAST_FURNACE_CALCITE_TRIPLE",
                "DISABLE_ALLOY_BLAST",
                "DISABLE_ALLOY_PROPERTY",
                "HIGH_SIFTER_OUTPUT ",
                "GENERATE_LENS",
                "CRYSTALLIZABLE",
                "NO_UNIFICATION",
                "DISABLE_DECOMPOSITION",
                "EXPLOSIVE",
                "FLAMMABLE",
                "STICKY",
                "PHOSPHORESCENT",
                "FIRE_RESISTANT",
                "DECOMPOSITION_BY_CENTRIFUGING",
                "DECOMPOSITION_BY_ELECTROLYZING"});
        tabs.addTab("Flags", new JScrollPane(flagList));

        // --- RIGHT: OUTPUT ---
        JPanel rightPanel = new JPanel(new BorderLayout());

        // 1. Create a control bar for the toggle
        JPanel outputControls = new JPanel(new FlowLayout(FlowLayout.LEFT));
        kubeJSMode = new JCheckBox("KubeJS Output Mode");
        kubeJSMode.addActionListener(e -> updateCode());
        outputControls.add(kubeJSMode);

        materialOutput = new JTextArea();
        materialOutput.setFont(new Font("Monospaced", Font.PLAIN, 12));
        materialOutput.setLineWrap(true);
        materialOutput.setWrapStyleWord(true);

        langOutput = new JTextArea();

        JPanel langWrapper = new JPanel(new BorderLayout());
        JButton quickAqua = new JButton("Prepend §b");
        quickAqua.addActionListener(e -> nameField.setText("§b" + nameField.getText()));
        langWrapper.add(new JScrollPane(langOutput), BorderLayout.CENTER);
        langWrapper.add(quickAqua, BorderLayout.SOUTH);

        JSplitPane split = new JSplitPane(JSplitPane.VERTICAL_SPLIT, new JScrollPane(materialOutput), langWrapper);
        split.setDividerLocation(600);

        // 2. Layout: Controls at the top, Output in the center
        rightPanel.add(outputControls, BorderLayout.NORTH);
        rightPanel.add(split, BorderLayout.CENTER);

        attachUpdateListeners();
        mainPanel.add(leftPanel, BorderLayout.WEST);
        mainPanel.add(tabs, BorderLayout.CENTER);
        mainPanel.add(rightPanel, BorderLayout.EAST);
        add(mainPanel);
        updateCode();
    }

    private void addLabeledField(JPanel p, String label, JTextField f) {
        p.add(new JLabel(label)); p.add(f);
    }

    private void attachUpdateListeners() {
        DocumentListener dl = new DocumentListener() {
            public void insertUpdate(DocumentEvent e) { updateCode(); }
            public void removeUpdate(DocumentEvent e) { updateCode(); }
            public void changedUpdate(DocumentEvent e) { updateCode(); }
        };
        JTextField[] fields = {idField, nameField, colorField, secColorField, bTempField, bDurationField, bEutField,
                fPipeTemp, fPipeThroughput, itemPriority, itemStacksPerSec, rotorPower, rotorEff, rotorDamage, rotorDurability,
                toolSpeed, toolDamage, toolDurability, toolLevel, voltage, amperage, lossPerBlock};
        for(JTextField f : fields) f.getDocument().addDocumentListener(dl);

        JCheckBox[] boxes = {ingotCheck, dustCheck, gemCheck, fluidCheck, plasmaCheck, enableFluidPipe, fGasProof,
                fAcidProof, fCryoProof, fPlasmaProof, isSuperconductor,  enableItemPipe, enableRotor, enableCable, enableTools, toolUnbreakable, toolMagnetic};
        for(JCheckBox b : boxes) b.addActionListener(e -> updateCode());

        gasBox.addActionListener(e -> updateCode());
        iconSetBox.addActionListener(e -> updateCode());
        flagList.addListSelectionListener(e -> updateCode());
        toolTypeList.addListSelectionListener(e -> updateCode());
    }

    private void updateCode() {
        String id = idField.getText();
        boolean kjs = kubeJSMode.isSelected();
        StringBuilder sb = new StringBuilder();
        String indent = "    ";

        // 1. Header
        if (kjs) {
            sb.append("event.create(\"").append(id).append("\")\n");
        } else {
            sb.append(id.toUpperCase()).append(" = new Material.Builder(PhoenixCore.id(\"").append(id).append("\"))\n");
        }

        // 2. Forms
        if (ingotCheck.isSelected()) sb.append(indent).append(".ingot()\n");
        if (dustCheck.isSelected())  sb.append(indent).append(".dust()\n");
        if (gemCheck.isSelected())   sb.append(indent).append(".gem()\n");
        if (fluidCheck.isSelected()) {
            if (kjs) sb.append(indent).append(".liquid(new GTFluidBuilder())\n");
            else sb.append(indent).append(".fluid()\n");
        }
        if (plasmaCheck.isSelected()) sb.append(indent).append(".plasma()\n");

        // 3. Colors (Universal)
        sb.append(indent).append(".color(0x").append(colorField.getText()).append(")");
        if (!secColorField.getText().isEmpty()) {
            sb.append(".secondaryColor(0x").append(secColorField.getText()).append(")");
        }
        sb.append("\n");

        // 4. IconSet
        if (kjs) {
            sb.append(indent).append(".iconSet(\"").append(Objects.requireNonNull(iconSetBox.getSelectedItem()).toString().toLowerCase()).append("\")\n");
        } else {
            sb.append(indent).append(".iconSet(MaterialIconSet.").append(iconSetBox.getSelectedItem()).append(")\n");
        }

        // 5. Properties (Tools)
        if (enableTools.isSelected()) {
            List<String> selectedTools = toolTypeList.getSelectedValuesList();
            String typesArray = selectedTools.isEmpty() ? "null" :
                    (kjs ? "[" + selectedTools.stream().map(t -> "GTToolType." + t).collect(Collectors.joining(", ")) + "]"
                            : "new GTToolType[]{" + selectedTools.stream().map(t -> "GTToolType." + t).collect(Collectors.joining(", ")) + "}");

            sb.append(indent).append(".toolStats(");
            if ((toolUnbreakable.isSelected() || toolMagnetic.isSelected())) {
                sb.append("ToolProperty.Builder.of(");
                sb.append("new ToolProperty(");
            }

            sb.append(String.format("%s, %s, %s, %s, %s)",
                    toolSpeed.getText(), toolDamage.getText(), toolDurability.getText(), toolLevel.getText(), typesArray));

            if ( (toolUnbreakable.isSelected() || toolMagnetic.isSelected())) {
                if (toolUnbreakable.isSelected()) sb.append("\n").append(indent).append("    .unbreakable()");
                if (toolMagnetic.isSelected()) sb.append("\n").append(indent).append("    .magnetic()");
                sb.append("\n").append(indent).append("    .build()");
            }
            sb.append("\n");
        }

        // 6. Pipe & Cable Properties
        if (enableFluidPipe.isSelected()) {
            sb.append(indent).append(".fluidPipeProperties(").append(fPipeTemp.getText()).append(", ").append(fPipeThroughput.getText()).append(", ")
                    .append(fGasProof.isSelected()).append(", ").append(fAcidProof.isSelected()).append(", ")
                    .append(fCryoProof.isSelected()).append(", ").append(fPlasmaProof.isSelected()).append(")\n");
        }
        if (enableCable.isSelected()) {
            sb.append(indent).append(".cableProperties(").append(voltage.getText()).append(", ").append(amperage.getText()).append(", ")
                    .append(lossPerBlock.getText()).append(", ").append(isSuperconductor.isSelected()).append(")\n");
        }
        // --- ROTOR STATS ---
        if (enableRotor.isSelected()) {
            sb.append(indent).append(".rotorStats(")
                    .append(rotorPower.getText()).append(", ")
                    .append(rotorEff.getText()).append(", ")
                    .append(rotorDamage.getText()).append("F, ")
                    .append(rotorDurability.getText()).append(")\n");
        }

        // --- ITEM PIPES ---
        if (enableItemPipe.isSelected()) {
            sb.append(indent).append(".itemPipeProperties(")
                    .append(itemPriority.getText()).append(", ")
                    .append(itemStacksPerSec.getText()).append(")\n");
        }

        // 7. Blast Furnace
        try {
            int bt = Integer.parseInt(bTempField.getText());
            if (bt > 0) {
                String gas = (String) gasBox.getSelectedItem();
                String gasVal = (gas == null || gas.equals("null")) ? "null" : (kjs ? "GTGasTier." + gas : "GasTier." + gas);
                sb.append(indent).append(".blastTemp(").append(bt).append(", ").append(gasVal).append(", GTValues.")
                        .append(bEutField.getText()).append(", ").append(bDurationField.getText()).append(")\n");
            }
        } catch (Exception ignored) {}

        // 8. Flags (With smart wrapping)
        List<String> flags = flagList.getSelectedValuesList();
        if (!flags.isEmpty()) {
            String flagPrefix = kjs ? "GTMaterialFlags." : "";
            sb.append(indent).append(".flags(");
            for (int i = 0; i < flags.size(); i++) {
                sb.append(flagPrefix).append(flags.get(i));
                if (i < flags.size() - 1) {
                    sb.append(", ");
                    if ((i + 1) % 2 == 0) sb.append("\n").append(indent).append("       ");
                }
            }
            sb.append(")\n");
        }

        // 9. Footer
        if (!kjs) sb.append(indent).append(".buildAndRegister();");

        materialOutput.setText(sb.toString());
        langOutput.setText("addMaterialLang(provider, \"" + id + "\", \"" + nameField.getText() + "\");");
    }

    public static void main(String[] args) {
        try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); } catch (Exception ignored) {}
        SwingUtilities.invokeLater(() -> new PhoenixMaterialArchitect().setVisible(true));
    }
}