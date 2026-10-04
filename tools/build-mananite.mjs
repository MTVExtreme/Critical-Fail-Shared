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
const UTIL = "critical-fail-pf1e-utilities";

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

function shotAction({
  name, formula, types, range, increments, cone, footer, mananite = false, cost = 0, critRange = 20,
  attackBonus = "", touch = false, activation = "attack", extraType = "standard", ray = false
}) {
  const action = {
    _id: foundryId(`mananite-action|${name}|${formula}|${types.join(",")}|${range}|${footer}|${critRange}|${attackBonus}|${activation}`),
    name,
    img: "",
    actionType: "rwak",
    activation: { type: activation, unchained: { type: activation } },
    ability: { attack: "_default", critMult: 2, critRange },
    damage: { parts: [{ formula, types }] },
    duration: { units: "inst" },
    extraAttacks: { type: extraType },
    range: { value: String(range), units: "ft", maxIncrements: increments },
    notes: { footer: [footer] }
  };
  if (attackBonus) action.attackBonus = attackBonus;
  if (touch) action.touch = true;
  if (mananite) action.ammo = { type: "mananite", cost };
  if (cone) action.measureTemplate = { type: "cone", size: String(range), color: "#7fd4ff" };
  if (ray) action.measureTemplate = { type: "ray", size: String(range), color: "#7fd4ff" };
  return action;
}

function elementActions({ dice, formula, range, increments, cone, footer, label, cost, critRange = 20, ...rest }) {
  const damage = formula ?? `${dice}d6`;
  return ELEMENTS.map(([type, element]) => shotAction({
    name: label ? `${label} (${element})` : element,
    formula: damage,
    types: [type],
    range,
    increments,
    cone,
    footer,
    mananite: true,
    cost,
    critRange,
    ...rest
  }));
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
    `<li><b>Charges:</b> ${capacity}. The item quantity is the remaining charges.</li>`,
    "<li><b>Charge use:</b> 1 when discharged directly</li>",
    `<li><b>Recharges (integrity):</b> ${quality.integrity}</li>`,
    `<li><b>Market value:</b> ${gp(value)}</li>`,
    `<li><b>Recharge cost:</b> ${gp(rechargeCost)} (${gp(stage.recharge)} per charge)</li>`,
    `<li><b>Die:</b> ${die}</li>`,
    `<li><b>Discharge:</b> ${discharge}, ${blast}</li>`,
    "</ul>",
    `<p>Mananite ammunition for a ${size.name} caster gun. Its quantity is the charge pool, and a shot spends the gun's draw from that quantity. The gun's damage die becomes ${die}. Discharging the crystal directly spends 1 charge.</p>`
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
    flags: {
      [FLAG]: { mananite: "crystal", size: size.name, quality: quality.name, stage: stage.name },
      [UTIL]: { mananiteCharge: { size: size.name, quality: quality.name, sides: quality.sides, stage: stage.name } }
    },
    system: {
      description: { value: description, instructions: "" },
      tags: ["Mananite", size.name, quality.name, stage.name],
      ...physical(value / Math.max(capacity, 1), size.weight / Math.max(capacity, 1), size.pf1),
      quantity: capacity,
      hp: { base: 5 },
      broken: false,
      hardness: 5,
      subType: "ammo",
      extraType: "mananite",
      abundant: false,
      recoverChance: 0,
      uses: {
        value: null,
        per: "",
        autoDeductChargesCost: "1",
        maxFormula: "",
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

function gunRuntime(coreSize, actions, profiles) {
  const byAction = {};
  actions.forEach((action, index) => {
    byAction[action._id] = profiles[index];
  });
  return { coreSize, actions: byAction };
}

function weaponShell({ name, kind, hands, price, weight, actions, description, img, group, runtime, properties = {}, groups = ["firearms"] }) {
  return {
    _id: foundryId(`mananite-weapon|${name}`),
    name,
    type: "weapon",
    img,
    folder: group,
    sort: 0,
    ownership: { default: 0 },
    effects: [],
    flags: {
      [FLAG]: { mananite: kind },
      [UTIL]: { mananiteGun: runtime }
    },
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
      ammo: { type: "mananite", capacity: null, misfire: null, explode: null },
      subType: "exotic",
      weaponSubtype: "ranged",
      hands,
      baseTypes: [name],
      weaponGroups: groups,
      material: { base: { value: "steel", custom: false }, normal: { value: "", custom: false }, addon: [] },
      properties,
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

const SIEGE = {
  "Field Caster Cannon": { crew: 3, aim: 1, load: 3, size: "Huge" },
  "Siege Caster": { crew: 5, aim: 3, load: 5, size: "Gargantuan" },
  "Grand Caster": { crew: 6, aim: 4, load: 6, size: "Colossal" }
};

function firingMode(name) {
  if (name === "Rotary Caster") return "slow";
  if (SIEGE[name]) return "siege";
  if (name === "Scattercaster") return "scatter";
  return "semi";
}

function withSecondShot(actions) {
  for (const action of actions) {
    action.extraAttacks = {
      type: "custom",
      manual: [{ name: "Second shot", formula: "0" }]
    };
  }
  return actions;
}

function casterGun(row, folderId, sort) {
  const [name, type, core, dice, range, cone, draw, chassis, corePrice, starter, frame] = row;
  const hands = type.startsWith("Concealable") || type.startsWith("Light") || type === "1H" ? 1 : 2;
  const increments = cone || range >= 600 ? 1 : 5;
  const rangeText = cone ? `${range}-ft. cone` : `${range.toLocaleString("en-US")} ft.`;
  const mode = firingMode(name);
  const shotFooter = `Touch attack. Draws ${draw} charge${draw === 1 ? "" : "s"} from the loaded ${core} Mananite crystal. Damage die follows that crystal's quality. Critical 19–20/×2.`;
  const actions = [];
  const profiles = [];
  let properties = {};
  let groups = ["firearms"];
  let firing = "";

  if (mode === "slow") {
    properties = { slf: true };
    const shots = elementActions({
      dice, range, increments, cone, cost: draw, critRange: 19, touch: true,
      activation: "full", extraType: "",
      footer: `${shotFooter} Slow-firing: a full-round action, with no iterative attacks and no automatic fire.`
    });
    actions.push(...shots);
    profiles.push(...shots.map(() => ({ dice, draw, scale: true, solo: true })));
    firing = "<li><b>Firing:</b> Slow-firing touch weapon. One shot is a full-round action. No iterative attacks, and it cannot fire an automatic burst.</li>";
  } else if (mode === "siege") {
    const siege = SIEGE[name];
    groups = ["firearms", "siegeEngines"];
    const shots = elementActions({
      dice, range, increments, cone: false, cost: draw, critRange: 19, touch: true,
      activation: "standard", extraType: "",
      footer: `${shotFooter} Siege engine. Fire only after it is loaded and aimed. No iterative attacks and no precision damage.`
    });
    actions.push(...shots);
    profiles.push(...shots.map(() => ({ dice, draw, scale: true, solo: true })));
    firing = [
      `<li><b>Firing:</b> ${siege.size} direct-fire siege engine, and a touch attack. Crew ${siege.crew}. Loading takes ${siege.load} full-round actions. Aiming takes ${siege.aim} full-round action${siege.aim === 1 ? "" : "s"}, doubled with a short crew. Firing a loaded, aimed gun is a standard action and does not allow iterative attacks.</li>`,
      "<li><b>Aim penalty:</b> -2 per size category the gun is larger than the creature aiming it. Knowledge (engineering) ignores that penalty. An extra crew member no more than three sizes smaller than the gun reduces it by 2.</li>",
      "<li><b>Precision:</b> No sneak attack or other precision damage. It cannot fire an automatic burst.</li>"
    ].join("");
  } else if (mode === "scatter") {
    properties = { sma: true, sct: true };
    const shots = withSecondShot(elementActions({
      dice, range, increments, cone, cost: draw, critRange: 19, touch: true, extraType: "custom",
      footer: `${shotFooter} Scatter cone. A full attack fires twice at -2, or at -6 if Rapid Shot is also used.`
    }));
    actions.push(...shots);
    profiles.push(...shots.map(() => ({ dice, draw, scale: true, semi: true })));
    firing = "<li><b>Firing:</b> Scatter, semi-automatic, and touch. One shot is an attack. A full attack fires twice, both at -2. With Rapid Shot checked, every shot is -6 and Rapid Shot's extra attack is included. It does not fire an automatic line.</li>";
  } else {
    properties = { sma: true, ato: true };
    const shots = withSecondShot(elementActions({
      dice, range, increments, cone, cost: draw, critRange: 19, touch: true, extraType: "custom",
      footer: `${shotFooter} Semi-automatic. A full attack fires twice at -2, or at -6 if Rapid Shot is also used.`
    }));
    const automaticFooter = `Automatic line, touch attack, -2 to hit. Draws 10 charges. One attack roll against each creature in the line; concealment does not apply. No precision damage or Vital Strike. On a full attack, one burst per attack you have, and haste is at full BAB with the -2. Requires a Stage 3 or higher crystal. Critical 19–20/×2.`;
    const autos = elementActions({
      label: "Automatic", dice, range, increments, cone: false, cost: 10, critRange: 19,
      touch: true, attackBonus: "-2", extraType: "standard", ray: true, footer: automaticFooter
    });
    actions.push(...shots, ...autos);
    profiles.push(
      ...shots.map(() => ({ dice, draw, scale: true, semi: true })),
      ...autos.map(() => ({ dice, draw: 10, scale: true, automatic: true }))
    );
    firing = "<li><b>Firing:</b> Semi-automatic and touch. One shot is an attack. A full attack fires twice, both at -2. With Rapid Shot checked, every shot is -6 and Rapid Shot's extra attack is included. Haste still adds an attack at full BAB, with that same penalty.</li>";
    firing += "<li><b>Automatic:</b> With a Stage 3 or higher crystal, an Automatic attack fires a line at -2 and spends 10 charges. Roll against each creature in the line. Concealment does not apply, and precision damage and Vital Strike do not apply. A full attack fires one burst per attack you have.</li>";
  }

  const description = [
    `<p>${name}. ${type}. Ammunition: a ${core} Mananite crystal. Attacks are touch attacks and threaten a critical hit on 19–20.</p>`,
    "<ul>",
    `<li><b>Chassis:</b> ${gp(chassis)}</li>`,
    `<li><b>Stage 1 Pristine core:</b> ${gp(corePrice)}</li>`,
    `<li><b>Starter cost:</b> ${gp(starter)}</li>`,
    `<li><b>Range:</b> ${rangeText}</li>`,
    `<li><b>Draw:</b> ${draw} charge${draw === 1 ? "" : "s"} per shot</li>`,
    `<li><b>Critical:</b> 19–20/×2</li>`,
    `<li><b>Damage:</b> ${dice} dice. The die comes from the loaded crystal: ${qualityList()}.</li>`,
    firing,
    "</ul>",
    "<p>Pick the energy type when you attack. Load the crystal in the ammunition list on the attack dialog. Critical Fail PF1e Utilities sets the damage die from that crystal and spends the draw from its charges.</p>"
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
    group: folderId,
    properties,
    groups,
    runtime: gunRuntime(core, actions, profiles)
  });
  item.sort = sort;
  return item;
}

function supercombineAction({ dice, footer }) {
  return {
    _id: foundryId(`mananite-action|Supercombine|${dice}|${footer}`),
    name: "Supercombine",
    img: "",
    actionType: "save",
    activation: { type: "standard", unchained: { type: "standard" } },
    damage: { parts: [{ formula: `${dice}d6`, types: ["force"] }] },
    duration: { units: "inst" },
    range: { value: "5", units: "ft", maxIncrements: 1 },
    save: {
      dc: "10 + @abilities.dex.mod",
      type: "ref",
      description: "A successful Reflex save halves the force damage.",
      harmless: false
    },
    measureTemplate: { type: "circle", size: "5", color: "#7fd4ff" },
    ammo: { type: "mananite", cost: 0 },
    notes: { footer: [footer] },
    extraAttacks: { type: "" }
  };
}

function shardcaster(row, folderId, sort) {
  const [name, type, core, shard, combineDice, range, hands, chassis, corePrice, starter, frame] = row;
  const shardCount = Number(shard.split("d")[0]);
  const single = shotAction({
    name: "Single Shot",
    formula: shard,
    types: ["piercing"],
    range,
    increments: 5,
    cone: false,
    footer: `One piercing shard. No attack penalty. Normal iterative attacks, and haste is at full BAB. Spends 1 charge. Critical 18–20/×2.`,
    mananite: true,
    cost: 1,
    critRange: 18
  });
  const burst = shotAction({
    name: "3-Round Burst",
    formula: shard,
    types: ["piercing"],
    range,
    increments: 5,
    cone: false,
    footer: `One 3-round burst is a standard action at a flat -3. All three rounds use that same penalty. A full attack fires one burst for each attack you have, including the -5 and -10 iterative attacks, and haste fires a burst at full BAB with the -3. No precision damage or Vital Strike. 1 charge per shard. Critical 18–20/×2.`,
    mananite: true,
    cost: 1,
    critRange: 18,
    attackBonus: "-3"
  });
  const automatic = shotAction({
    name: "Automatic",
    formula: `${shardCount * 3}${shard.slice(shard.indexOf("d"))}`,
    types: ["piercing"],
    range,
    increments: 5,
    cone: false,
    ray: true,
    footer: `Stage 3 or higher. Line attack at -2, spending 30 charges. Each creature in the line takes one hit, and that hit deals 3 shards. Concealment does not apply. No precision damage or Vital Strike. On a full attack, one burst per attack you have. Critical 18–20/×2.`,
    mananite: true,
    cost: 30,
    critRange: 18,
    attackBonus: "-2"
  });
  const combine = supercombineAction({
    dice: combineDice,
    footer: `Force damage in a 5-foot burst. Reflex half (DC 10 + Dexterity modifier). No attack roll and no critical hit. Spends no additional charges. ${combineDice} dice, using the loaded crystal's quality.`
  });
  const actions = [single, burst, automatic, combine];
  const description = [
    `<p>${name}. ${type}. Ammunition: a ${core} Mananite crystal. This is not a touch weapon. Attack rolls threaten a critical hit on 18–20.</p>`,
    "<ul>",
    `<li><b>Chassis:</b> ${gp(chassis)}</li>`,
    `<li><b>Stage 1 Pristine core:</b> ${gp(corePrice)}</li>`,
    `<li><b>Starter cost:</b> ${gp(starter)}</li>`,
    `<li><b>Range:</b> ${range} ft.</li>`,
    `<li><b>Single Shot:</b> ${shard} piercing. No penalty. Normal iterative attacks, and haste at full BAB. 1 charge.</li>`,
    `<li><b>3-Round Burst:</b> ${shard} piercing at a flat -3 on every round. A standard action fires one burst. A full attack fires one burst per attack, so iterative attacks are at -5 and -10 on top of the -3, and haste is at full BAB with the -3. Precision damage and Vital Strike do not apply. 1 charge per shard.</li>`,
    `<li><b>Automatic:</b> Stage 3 or higher. A line at -2 that spends 30 charges. Each target takes 3 shards (${shardCount * 3}${shard.slice(shard.indexOf("d"))}) on one hit. Concealment, precision damage, and Vital Strike do not apply.</li>`,
    `<li><b>Supercombine:</b> ${combineDice} force dice in a 5-foot burst, Reflex half. No attack roll, no critical hit, and no additional charges. Die: ${qualityList()}.</li>`,
    "</ul>"
  ].join("");
  const profiles = [
    { dice: shardCount, draw: 1, scale: false },
    { dice: shardCount, draw: 1, scale: false, burst: true },
    { dice: shardCount * 3, draw: 30, scale: false, automatic: true },
    { dice: combineDice, draw: 0, scale: true }
  ];
  const item = weaponShell({
    name,
    kind: "shardcaster",
    hands,
    price: chassis,
    weight: hands === 1 ? 3 : 8,
    actions,
    description,
    img: SHARD_ICONS[frame],
    group: folderId,
    properties: { ato: true },
    runtime: gunRuntime(core, actions, profiles)
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
console.log("sample", sample.name, "unit price", sample.system.price, "quantity", sample.system.quantity, "unit weight", sample.system.weight.value);
const service = guns.find((item) => item.name === "Service Caster Pistol");
const rotary = guns.find((item) => item.name === "Rotary Caster");
const field = guns.find((item) => item.name === "Field Caster Cannon");
console.log("service", service.system.actions.map((action) => action.name).join(", "));
console.log("service touch", service.system.actions[0].touch, "crit", service.system.actions[0].ability.critRange, "auto", service.system.actions[6].attackBonus, service.system.actions[6].ammo.cost);
console.log("rotary", rotary.system.actions[0].activation.type, rotary.system.properties);
console.log("field", field.system.actions[0].activation.type, field.system.weaponGroups.join(","));
console.log("shard", shards[0].system.actions.map((action) => `${action.name} crit ${action.ability?.critRange ?? "none"} bonus ${action.attackBonus ?? ""} cost ${action.ammo?.cost} ${action.damage.parts[0].formula}`).join(" | "));
console.log("crystal ammo", crystals[0].system.subType, crystals[0].system.extraType, crystals[0].flags[UTIL].mananiteCharge);

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
