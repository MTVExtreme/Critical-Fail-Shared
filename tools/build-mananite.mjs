/**
 * Builds Mananite crystals, caster guns, and shardcasters into Azure Realms Items.
 *
 *   node tools/build-mananite.mjs --dry
 *   node tools/build-mananite.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("F:/Code/Foundry Code/package.json");
const { ClassicLevel } = require("classic-level");

const DRY = process.argv.includes("--dry");
const SOURCE = "F:/Code/CriticalFailShared/Critical-Fail-Shared/packs/azure-realms-items";
const OUTPUTS = [
  "F:/Code/CriticalFailShared/Critical-Fail-Shared/packs/azure-realms-items",
  "H:/Foundry 2/Hyamda - 29998/Data/Data/modules/critical-fail-shared/packs/azure-realms-items"
];
const ICON = "modules/critical-fail-shared/img/icons";
const FLAG = "critical-fail-shared";

const SIZES = [
  { name: "Fine", capacity: 2, weight: 0.25, dice: 1, radius: 0, gunDice: 1, pf1: "fine" },
  { name: "Diminutive", capacity: 4, weight: 0.5, dice: 2, radius: 5, gunDice: 1, pf1: "dim" },
  { name: "Tiny", capacity: 8, weight: 1, dice: 4, radius: 10, gunDice: 1, pf1: "tiny" },
  { name: "Small", capacity: 16, weight: 2, dice: 8, radius: 20, gunDice: 2, pf1: "sm" },
  { name: "Medium", capacity: 32, weight: 4, dice: 16, radius: 40, gunDice: 4, pf1: "med" },
  { name: "Large", capacity: 64, weight: 8, dice: 32, radius: 80, gunDice: 6, pf1: "lg" },
  { name: "Huge", capacity: 128, weight: 16, dice: 64, radius: 160, gunDice: 8, pf1: "huge" },
  { name: "Gargantuan", capacity: 256, weight: 32, dice: 128, radius: 320, gunDice: 10, pf1: "grg" },
  { name: "Colossal", capacity: 512, weight: 64, dice: 256, radius: 640, gunDice: 12, pf1: "col" }
];
const QUALITIES = [
  { name: "Cracked", efficiency: 0.75, integrity: 1, priceMult: 0.5, sides: 4 },
  { name: "Flawed", efficiency: 0.875, integrity: 2, priceMult: 0.75, sides: 6 },
  { name: "Pristine", efficiency: 1, integrity: 4, priceMult: 1, sides: 6 },
  { name: "Marvelous", efficiency: 1.25, integrity: 8, priceMult: 2, sides: 8 },
  { name: "Flawless", efficiency: 1.5, integrity: 16, priceMult: 4, sides: 10 },
  { name: "Exceptional", efficiency: 2, integrity: 32, priceMult: 8, sides: 12 },
  { name: "Perfect", efficiency: 3, integrity: 64, priceMult: 20, sides: 12 }
];
const STAGES = [
  { name: "Unrefined", mult: 1, year: "Ancient", cost: 10, recharge: 10 },
  { name: "Stage 1", mult: 2, year: "958", cost: 8, recharge: 8 },
  { name: "Stage 2", mult: 3, year: "1224", cost: 6, recharge: 6 },
  { name: "Stage 3", mult: 4, year: "1400", cost: 4, recharge: 4 },
  { name: "Stage 4", mult: 5, year: "1688", cost: 2, recharge: 2 },
  { name: "Stage 5", mult: 6, year: "1756", cost: 1, recharge: 1 },
  { name: "Stage 6", mult: 8, year: "1970", cost: 0.5, recharge: 0.5 }
];
const ELEMENTS = [
  ["fire", "Fire"],
  ["cold", "Cold"],
  ["electricity", "Electricity"],
  ["acid", "Acid"],
  ["sonic", "Sonic"],
  ["force", "Force"]
];
const QUALITY_ORDER = ["Pristine", "Cracked", "Flawed", "Marvelous", "Flawless", "Exceptional", "Perfect"];

const CASTER_GUNS = [
  ["Palm Caster", "Concealable 1H", "Fine", 1, 30, false, 1, 250, 32, 282, "pistol"],
  ["Compact Caster", "Light 1H", "Diminutive", 1, 40, false, 1, 400, 64, 464, "pistol"],
  ["Service Caster Pistol", "1H", "Tiny", 1, 60, false, 1, 750, 128, 878, "pistol"],
  ["Caster Carbine", "2H", "Small", 2, 100, false, 2, 1500, 256, 1756, "rifle"],
  ["Caster Rifle", "2H", "Small", 2, 150, false, 2, 1800, 256, 2056, "rifle"],
  ["Scattercaster", "2H / Cone", "Small", 2, 30, true, 4, 2000, 256, 2256, "rifle"],
  ["Marksman Caster", "Precision 2H", "Medium", 4, 250, false, 4, 3500, 512, 4012, "rifle"],
  ["Support Repeater", "Heavy 2H", "Medium", 4, 120, false, 4, 5000, 512, 5512, "rifle"],
  ["Caster Lance", "Heavy 2H", "Large", 6, 300, false, 8, 9000, 1024, 10024, "rifle"],
  ["Rotary Caster", "Heavy / Emplaced", "Large", 6, 180, false, 8, 12000, 1024, 13024, "cannon"],
  ["Field Caster Cannon", "Light Artillery", "Huge", 8, 600, false, 16, 25000, 2048, 27048, "cannon"],
  ["Siege Caster", "Artillery", "Gargantuan", 10, 1000, false, 32, 60000, 4096, 64096, "cannon"],
  ["Grand Caster", "Fortress/Ship Gun", "Colossal", 12, 2000, false, 64, 150000, 8192, 158192, "cannon"]
];
const SHARDCASTERS = [
  ["Shardcaster Pistol", "1H - 3 Round Burst", "Tiny", "1d4", 6, 50, 1, 900, 128, 1028, "pistol"],
  ["Shardcaster Rifle", "2H - 3 Round Burst", "Small", "1d6", 12, 100, 2, 2200, 256, 2456, "rifle"]
];
const GUN_ICONS = {
  pistol: `${ICON}/caster-pistol.webp`,
  rifle: `${ICON}/caster-rifle.webp`,
  cannon: `${ICON}/caster-cannon.webp`
};
const SHARD_ICONS = {
  pistol: `${ICON}/shardcaster-pistol.webp`,
  rifle: `${ICON}/shardcaster-rifle.webp`
};

function foundryId(seed) {
  const hash = crypto.createHash("sha256").update(String(seed)).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += alphabet[hash[i] % alphabet.length];
  return id;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function trimNumber(value) {
  const rounded = round2(value);
  return Number.isInteger(rounded) ? rounded : rounded;
}

function gp(value) {
  const number = trimNumber(value);
  return `${number.toLocaleString("en-US")} gp`;
}

function stats() {
  return {
    coreVersion: "13.351",
    systemId: "pf1",
    systemVersion: "11.11",
    createdTime: 1759360000000,
    modifiedTime: 1759360000000,
    lastModifiedBy: null,
    compendiumSource: null,
    duplicateSource: null,
    exportSource: null
  };
}

function folder(name, sort, color) {
  return {
    _id: foundryId(`mananite-folder|${name}`),
    name,
    type: "Item",
    description: "",
    folder: null,
    sorting: "m",
    sort,
    color,
    flags: { [FLAG]: { mananite: "folder" } },
    _stats: stats()
  };
}

function physical(price, weight, size) {
  return {
    quantity: 1,
    weight: { value: weight },
    equipped: false,
    carried: true,
    price: trimNumber(price),
    size,
    resizing: false,
    timeworn: false,
    artifact: false,
    identified: true,
    unidentified: { price: 0, name: "" },
    cursed: false,
    cl: 0,
    aura: { custom: false, school: "" }
  };
}

function shotAction({ name, formula, types, range, increments, cone, footer }) {
  const action = {
    _id: foundryId(`mananite-action|${name}|${formula}|${types.join(",")}|${range}|${footer}`),
    name,
    img: "",
    actionType: "rwak",
    activation: { type: "attack", unchained: { type: "attack" } },
    ability: { attack: "_default", critMult: 2, critRange: 20 },
    damage: { parts: [{ formula, types }] },
    duration: { units: "inst" },
    extraAttacks: { type: "standard" },
    range: { value: String(range), units: "ft", maxIncrements: increments },
    notes: { footer: [footer] }
  };
  if (cone) action.measureTemplate = { type: "cone", size: String(range), color: "#7fd4ff" };
  return action;
}

function qualityActions(label, diceCount, range, increments, cone, footer) {
  const actions = [];
  for (const [type, element] of ELEMENTS) {
    const ordered = QUALITY_ORDER.map((name) => QUALITIES.find((quality) => quality.name === name));
    for (const quality of ordered) {
      actions.push(shotAction({
        name: `${label}${element} (${quality.name})`,
        formula: `${diceCount}d${quality.sides}`,
        types: [type],
        range,
        increments,
        cone,
        footer
      }));
    }
  }
  return actions;
}

function crystalStats(size, quality, stage) {
  const capacity = trimNumber(size.capacity * stage.mult * quality.efficiency);
  const value = trimNumber(size.capacity * stage.mult * stage.cost * quality.priceMult);
  const rechargeCost = trimNumber(capacity * stage.recharge);
  return { capacity, value, rechargeCost };
}

function crystalItem(size, quality, stage, folderId, sort) {
  const { capacity, value, rechargeCost } = crystalStats(size, quality, stage);
  const die = `d${quality.sides}`;
  const discharge = `${size.dice}${die}`;
  const blast = size.radius > 0 ? `${size.radius}-ft. radius` : "no blast radius";
  const name = `${size.name} ${quality.name} Mananite (${stage.name})`;
  const description = [
    `<p><em>Mananite crystal.</em> ${size.name}, ${quality.name} quality, ${stage.name} refinement. Introduced ${stage.year}.</p>`,
    "<ul>",
    `<li><b>Charge capacity:</b> ${capacity}</li>`,
    "<li><b>Charge use:</b> 1</li>",
    `<li><b>Recharges (integrity):</b> ${quality.integrity}</li>`,
    `<li><b>Market value:</b> ${gp(value)}</li>`,
    `<li><b>Recharge cost:</b> ${gp(rechargeCost)} (${gp(stage.recharge)} per charge)</li>`,
    `<li><b>Die:</b> ${die}</li>`,
    `<li><b>Discharge:</b> ${discharge}, ${blast}</li>`,
    "</ul>",
    `<p>Used as a gun core, this crystal makes the weapon's damage dice ${die}. Pick the attack whose energy and quality match how the crystal is fired. Discharging the crystal itself spends 1 charge.</p>`
  ].join("");
  const footer = `Discharges 1 charge. ${discharge}, ${blast}.`;
  const actions = ELEMENTS.map(([type, element]) => {
    const action = shotAction({
      name: `Discharge (${element})`,
      formula: discharge,
      types: [type],
      range: Math.max(size.radius, 10),
      increments: 1,
      cone: false,
      footer
    });
    action.activation = { type: "standard", unchained: { type: "standard" } };
    action.extraAttacks = { type: "" };
    if (size.radius > 0) {
      action.actionType = "other";
      action.measureTemplate = { type: "circle", size: String(size.radius), color: "#7fd4ff" };
    }
    return action;
  });
  return {
    _id: foundryId(`mananite-crystal|${name}`),
    name,
    type: "loot",
    img: `${ICON}/mananite-crystal.webp`,
    folder: folderId,
    sort,
    ownership: { default: 0 },
    effects: [],
    flags: { [FLAG]: { mananite: "crystal", size: size.name, quality: quality.name, stage: stage.name } },
    system: {
      description: { value: description, instructions: "" },
      tags: ["Mananite", size.name, quality.name, stage.name],
      ...physical(value, size.weight, size.pf1),
      hp: { base: 5 },
      broken: false,
      hardness: 5,
      subType: "misc",
      extraType: "",
      abundant: false,
      uses: {
        value: capacity,
        per: "charges",
        autoDeductChargesCost: "1",
        maxFormula: String(capacity),
        rechargeFormula: ""
      },
      actions,
      attackNotes: [],
      effectNotes: [],
      links: { children: [] },
      tag: "",
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      changes: [],
      contextNotes: []
    },
    _stats: stats()
  };
}

function weaponShell({ name, kind, hands, price, weight, actions, description, img, group }) {
  return {
    _id: foundryId(`mananite-weapon|${name}`),
    name,
    type: "weapon",
    img,
    folder: group,
    sort: 0,
    ownership: { default: 0 },
    effects: [],
    flags: { [FLAG]: { mananite: kind } },
    system: {
      description: { value: description, instructions: "" },
      tags: ["Mananite", kind === "shardcaster" ? "Shardcaster" : "Caster Gun"],
      ...physical(price, weight, "med"),
      hp: { base: 10 },
      broken: false,
      hardness: 10,
      changes: [],
      changeFlags: {
        immuneToMorale: false, loseDexToAC: false, noMediumEncumbrance: false, noHeavyEncumbrance: false,
        mediumArmorFullSpeed: false, heavyArmorFullSpeed: false, lowLightVision: false, seeInvisibility: false, seeInDarkness: false
      },
      contextNotes: [],
      actions,
      attackNotes: [],
      effectNotes: [],
      uses: { value: null, per: "", autoDeductChargesCost: "", maxFormula: "", rechargeFormula: "" },
      links: { children: [] },
      tag: "",
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      masterwork: false,
      enh: null,
      proficient: false,
      held: hands === 1 ? "1h" : "2h",
      ammo: { type: "", capacity: null, misfire: null, explode: null },
      subType: "exotic",
      weaponSubtype: "ranged",
      hands,
      baseTypes: [name],
      weaponGroups: ["firearms"],
      material: { base: { value: "steel", custom: false }, normal: { value: "", custom: false }, addon: [] },
      properties: {},
      showInQuickbar: true,
      sources: []
    },
    _stats: stats()
  };
}

function qualityList() {
  return QUALITIES.map((quality) => `${quality.name} d${quality.sides}`).join(", ");
}

function gunWeight(frame) {
  if (frame === "cannon") return 80;
  if (frame === "rifle") return 8;
  return 3;
}

function casterGun(row, folderId, sort) {
  const [name, type, core, dice, range, cone, draw, chassis, corePrice, starter, frame] = row;
  const hands = type.startsWith("Concealable") || type.startsWith("Light") || type === "1H" ? 1 : 2;
  const increments = cone || range >= 600 ? 1 : 5;
  const rangeText = cone ? `${range}-ft. cone` : `${range.toLocaleString("en-US")} ft.`;
  const footer = `Draws ${draw} charge${draw === 1 ? "" : "s"} from the ${core} Mananite core.`;
  const actions = qualityActions("", dice, range, increments, cone, footer);
  const description = [
    `<p>${name}. ${type}. Loads a ${core} Mananite crystal.</p>`,
    "<ul>",
    `<li><b>Chassis:</b> ${gp(chassis)}</li>`,
    `<li><b>Stage 1 Pristine core:</b> ${gp(corePrice)}</li>`,
    `<li><b>Starter cost:</b> ${gp(starter)}</li>`,
    `<li><b>Range:</b> ${rangeText}</li>`,
    `<li><b>Draw:</b> ${draw} charge${draw === 1 ? "" : "s"} per shot</li>`,
    `<li><b>Damage dice:</b> ${dice}. The die follows the crystal: ${qualityList()}.</li>`,
    "</ul>",
    "<p>Choose the attack whose energy and quality match the loaded crystal. Pristine crystals use d6, which is the damage shown on the caster gun table.</p>"
  ].join("");
  const item = weaponShell({
    name,
    kind: "caster-gun",
    hands,
    price: chassis,
    weight: gunWeight(frame),
    actions,
    description,
    img: GUN_ICONS[frame],
    group: folderId
  });
  item.sort = sort;
  return item;
}

function shardcaster(row, folderId, sort) {
  const [name, type, core, shard, combineDice, range, hands, chassis, corePrice, starter, frame] = row;
  const footer = "3-round burst.";
  const combineFooter = "Supercombine. Requires 6 Mananite crystals. The die follows crystal quality.";
  const shardActions = ELEMENTS.map(([element, label]) => shotAction({
    name: `Shard (${label})`,
    formula: shard,
    types: [element],
    range,
    increments: 5,
    cone: false,
    footer
  }));
  const combine = qualityActions("Supercombine ", combineDice, range, 5, false, combineFooter);
  const description = [
    `<p>${name}. ${type}. Loads a ${core} Mananite crystal. A normal shard is ${shard}. Supercombine spends 6 crystals and deals ${combineDice}d6 at Pristine quality.</p>`,
    "<ul>",
    `<li><b>Chassis:</b> ${gp(chassis)}</li>`,
    `<li><b>Stage 1 Pristine core:</b> ${gp(corePrice)}</li>`,
    `<li><b>Starter cost:</b> ${gp(starter)}</li>`,
    `<li><b>Range:</b> ${range} ft.</li>`,
    `<li><b>Shard:</b> ${shard}, chosen energy</li>`,
    `<li><b>Supercombine:</b> ${combineDice} dice. ${qualityList()}.</li>`,
    "</ul>",
    "<p>Use a Shard attack for one burst. Use a Supercombine attack when six crystals are combined, and pick the quality of those crystals.</p>"
  ].join("");
  const item = weaponShell({
    name,
    kind: "shardcaster",
    hands,
    price: chassis,
    weight: hands === 1 ? 3 : 8,
    actions: [...shardActions, ...combine],
    description,
    img: SHARD_ICONS[frame],
    group: folderId
  });
  item.sort = sort;
  return item;
}

function copyLevelPack(source, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(source)) {
    if (file === "LOCK" || file === "LOG" || file === "LOG.old" || file === "lost" || file.endsWith(".log")) continue;
    const full = path.join(source, file);
    if (!fs.statSync(full).isFile()) continue;
    fs.copyFileSync(full, path.join(dest, file));
  }
}

function publishPack(staged, output) {
  fs.mkdirSync(output, { recursive: true });
  const incoming = new Set(fs.readdirSync(staged));
  for (const file of fs.readdirSync(output)) {
    if (file === "LOCK" || file === "lost") continue;
    const full = path.join(output, file);
    if (!fs.statSync(full).isFile()) continue;
    if (!incoming.has(file)) {
      try { fs.rmSync(full); } catch (error) { console.error("Could not remove", full, error.message); }
    }
  }
  for (const file of incoming) {
    if (file === "LOCK") continue;
    try { fs.copyFileSync(path.join(staged, file), path.join(output, file)); }
    catch (error) { console.error("Could not copy", file, "to", output, error.message); }
  }
}

async function loadPack(dir) {
  const db = new ClassicLevel(dir, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  const folders = [];
  const docs = [];
  for await (const [key, value] of db.iterator()) {
    const parsed = JSON.parse(value);
    if (key.startsWith("!folders!")) folders.push(parsed);
    else docs.push(parsed);
  }
  await db.close();
  return { folders, docs };
}

async function writePack(dir, folders, docs) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const db = new ClassicLevel(dir, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  const ops = [
    ...folders.map((entry) => ({ type: "put", key: `!folders!${entry._id}`, value: JSON.stringify(entry) })),
    ...docs.map((entry) => ({ type: "put", key: `!items!${entry._id}`, value: JSON.stringify(entry) }))
  ];
  const size = 200;
  for (let i = 0; i < ops.length; i += size) await db.batch(ops.slice(i, i + size));
  await db.compactRange("!", "~");
  await db.close();
}

const crystalFolders = SIZES.map((size, index) => folder(`Mananite, ${size.name}`, index, "#1a6fbf"));
const gunFolder = folder("Caster Guns", 100, "#6b4a2e");
const shardFolder = folder("Mananite Shardcasters", 110, "#5c3d73");
const crystals = [];
for (const size of SIZES) {
  const holder = crystalFolders.find((entry) => entry.name === `Mananite, ${size.name}`);
  STAGES.forEach((stage, stageIndex) => {
    QUALITIES.forEach((quality, qualityIndex) => {
      crystals.push(crystalItem(size, quality, stage, holder._id, stageIndex * 10 + qualityIndex));
    });
  });
}
const guns = CASTER_GUNS.map((row, index) => casterGun(row, gunFolder._id, index));
const shards = SHARDCASTERS.map((row, index) => shardcaster(row, shardFolder._id, index));
const sample = crystals.find((item) => item.name === "Tiny Marvelous Mananite (Stage 2)");
console.log("crystals", crystals.length, "guns", guns.length, "shardcasters", shards.length);
console.log("sample", sample.name, "price", sample.system.price, "charges", sample.system.uses.value, "actions", sample.system.actions.length);
console.log("pistol attacks", guns[2].system.actions.length, guns[2].system.actions[0].name, guns[2].system.actions[0].damage.parts[0].formula);
console.log("shard attacks", shards[0].system.actions.length, shards[0].system.actions[0].name, shards[0].system.actions[6].name);

if (DRY) process.exit(0);

const copy = path.join(process.env.TEMP, "azure-items-mananite-src");
copyLevelPack(SOURCE, copy);
const pack = await loadPack(copy);
const keptFolders = pack.folders.filter((entry) => !entry.flags?.[FLAG]?.mananite);
const keptDocs = pack.docs.filter((entry) => !entry.flags?.[FLAG]?.mananite);
const folders = [...keptFolders, ...crystalFolders, gunFolder, shardFolder];
const docs = [...keptDocs, ...crystals, ...guns, ...shards];
const staged = path.join(process.env.TEMP, "azure-items-mananite");
await writePack(staged, folders, docs);
for (const output of OUTPUTS) {
  publishPack(staged, output);
  console.log("Updated", output);
}
