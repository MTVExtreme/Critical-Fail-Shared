/**
 * Insert the Astral Sphinx into a copy of the Azure Realms Monsters pack.
 * Usage: node tools/build-astral-sphinx.mjs <pack directory>
 */
import { ClassicLevel } from "file:///H:/Foundry%202/FoundryVTT-Node-13.342/node_modules/classic-level/index.js";
import fs from "fs";

const pack = process.argv[2];
if (!pack) {
  console.error("Pass the azure-realms-monsters pack directory.");
  process.exit(1);
}

const ACTOR_ID = "CfAstralSphinx1";
const ARCHIVE_ID = "CfGrandArchive01";
const FOLDER_ID = "CfArchiveConstr1";
const MODULE = "critical-fail-pf1e-utilities";
const PORTRAIT = "modules/critical-fail-shared/img/creatures/Androsphinx.webp";
const TOKEN = "modules/critical-fail-shared/img/creatures/Androsphinx%20Token.webp";
const NOW = Date.now();

let serial = 0;
function nid() {
  serial += 1;
  return `CfAs${serial.toString(16).padStart(12, "0")}`;
}

function stats() {
  return {
    systemId: "pf1",
    systemVersion: "11.11",
    coreVersion: "13.351",
    createdTime: NOW,
    modifiedTime: NOW,
    lastModifiedBy: null,
    compendiumSource: null,
    duplicateSource: null,
    exportSource: null,
  };
}

function description(html) {
  return { value: html, instructions: "", unidentified: "" };
}

const db = new ClassicLevel(pack, { keyEncoding: "utf8", valueEncoding: "json" });
await db.open();

let mummy = null;
let genericSpell = null;
const spellsByName = new Map();
const featsByName = new Map();

for await (const [key, value] of db.iterator({ gte: "!actors!", lt: "!actors!~" })) {
  if (!key.startsWith("!actors!")) continue;
  if (value?.name === "Golem, Mummy") mummy = value;
}

if (!mummy) throw new Error("Golem, Mummy was not in the pack; it is the structural template.");

const wantedSpells = new Set([
  "true seeing", "analyze dweomer", "contact other plane", "telepathic bond", "wall of force",
  "arcane eye", "fire shield", "scrying", "wall of fire", "arcane sight", "clairaudience/clairvoyance",
  "daylight", "fireball", "detect thoughts", "flaming sphere", "glitterdust", "resist energy",
  "see invisibility", "alarm", "burning hands", "comprehend languages", "detect secret doors",
  "identify", "dancing lights", "detect magic", "light", "mage hand", "mending", "message",
  "prestidigitation", "read magic", "resistance", "legend lore",
]);
const wantedFeats = new Set([
  "dodge", "great fortitude", "iron will", "lightning reflexes", "improved initiative",
  "alertness", "combat reflexes", "flyby attack", "hover", "mobility", "toughness",
]);

for await (const [key, value] of db.iterator({ gte: "!actors.items!", lt: "!actors.items!~" })) {
  if (!value?.name) continue;
  const name = value.name.toLowerCase();
  if (value.type === "spell" && wantedSpells.has(name) && !spellsByName.has(name)) spellsByName.set(name, value);
  if (value.type === "spell" && !genericSpell) genericSpell = value;
  if (value.type === "feat" && wantedFeats.has(name) && !featsByName.has(name)) featsByName.set(name, value);
}

let slam = null;
let constructClass = null;
for (const itemId of mummy.items || []) {
  const item = await db.get(`!actors.items!${mummy._id}.${itemId}`);
  if (item?.type === "attack" && /slam/i.test(item.name)) slam = item;
  if (item?.type === "class") constructClass = item;
}
if (!slam || !constructClass || !genericSpell) {
  throw new Error("Missing the mummy slam, construct class, or a spell to clone.");
}

const oldActors = [];
for await (const [key, value] of db.iterator({ gte: "!actors!", lt: "!actors!~" })) {
  if (value?.name === "Astral Sphinx" || value?._id === ACTOR_ID) oldActors.push(value._id);
}
for (const id of new Set(oldActors)) {
  await db.del(`!actors!${id}`);
  for (const prefix of [`!actors.items!${id}.`, `!actors.effects!${id}.`, `!actors.items.effects!${id}.`]) {
    const end = `${prefix.slice(0, -1)}/`;
    const keys = [];
    for await (const [key] of db.iterator({ gte: prefix, lt: end })) keys.push(key);
    for (const key of keys) await db.del(key);
  }
}

await db.put(`!folders!${ARCHIVE_ID}`, {
  name: "Grand Archive",
  sorting: "a",
  folder: null,
  type: "Actor",
  description: "The Grand Archive of Tekhpu and Nitaten.",
  sort: 250000,
  color: "#3ecbff",
  flags: {},
  _stats: stats(),
  _id: ARCHIVE_ID,
});
await db.put(`!folders!${FOLDER_ID}`, {
  name: "Constructs",
  sorting: "a",
  folder: ARCHIVE_ID,
  type: "Actor",
  description: "",
  sort: 100000,
  color: "#7ee7ff",
  flags: {},
  _stats: stats(),
  _id: FOLDER_ID,
});

function blankItem(base, name, type) {
  const item = structuredClone(base);
  item._id = nid();
  item.name = name;
  item.type = type || base.type;
  item.folder = null;
  item.sort = serial;
  item.effects = [];
  item.ownership = { default: 0 };
  item._stats = stats();
  item.flags = { ...(item.flags || {}), core: {} };
  delete item.flags["journal-links"];
  return item;
}

function change(target, formula, type = "untyped") {
  return { _id: nid().slice(-8), formula, operator: "add", priority: 0, target, type };
}

function action(name, extra = {}) {
  return {
    _id: nid(),
    name,
    img: "systems/pf1/icons/misc/magic-swirl.png",
    activation: { cost: 1, type: "special", unchained: { cost: 1, type: "action" } },
    duration: { units: "inst", value: "" },
    range: { units: "none" },
    target: { value: "" },
    uses: {},
    actionType: "other",
    notes: { effect: [] },
    ...extra,
  };
}

const itemIds = [];
const docs = [];

function add(item) {
  itemIds.push(item._id);
  docs.push(item);
  return item;
}

const classItem = blankItem(constructClass, "Construct", "class");
classItem.system.description = description("<p>32 Hit Dice construct. Base attack bonus equal to Hit Dice. Poor Fortitude, Reflex, and Will before feats and ability scores. The listed 376 hit points include Mananite reinforcement and are stored on this class.</p>");
classItem.system.level = 32;
classItem.system.hd = 10;
classItem.system.hp = 376;
classItem.system.bab = "high";
classItem.system.skillsPerLevel = 2;
classItem.system.savingThrows = { fort: { value: "low" }, ref: { value: "low" }, will: { value: "low" } };
classItem.system.changes = [];
classItem.system.contextNotes = [];
if (classItem.system.classSkills) {
  for (const key of Object.keys(classItem.system.classSkills)) classItem.system.classSkills[key] = false;
}
add(classItem);

function naturalAttack(name, formula) {
  const item = blankItem(slam, name, "attack");
  item.img = slam.img || "systems/pf1/icons/feats/improved-unarmed-strike.jpg";
  item.system.subType = "natural";
  item.system.nonlethal = true;
  item.system.showInQuickbar = true;
  item.system.attackName = name;
  item.system.description = description("<p>Restrained force. The attack deals nonlethal bludgeoning damage and only +4 damage, not the sphinx's full Strength modifier. The die scales with its current size; the +4 does not.</p>");
  const attack = item.system.actions?.[0] || action(name);
  attack.name = name;
  attack.actionType = "mwak";
  attack.range = { units: "melee" };
  attack.nonlethal = true;
  attack.ability = { attack: "str", damage: "", damageMult: 1, critRange: 20, critMult: 2 };
  attack.damage = { parts: [{ formula, types: ["bludgeoning"] }] };
  attack.naturalAttack = { primary: true, secondary: { attackBonus: "0", damageMult: 1 } };
  attack.notes = { effect: ["Nonlethal. Damage bonus is +4, not Strength."] };
  item.system.actions = [attack];
  return add(item);
}

naturalAttack("Claw", "sizeRoll(1, 3, @size) + 4");
naturalAttack("Claw", "sizeRoll(1, 3, @size) + 4");
naturalAttack("Bite", "sizeRoll(1, 4, @size) + 4");

function feat(name, html, changes = [], extra = {}) {
  const base = featsByName.get(name.toLowerCase()) || featsByName.get("dodge") || constructClass;
  const item = blankItem(base, name, "feat");
  item.system.description = description(html);
  item.system.changes = changes;
  item.system.subType = extra.subType || "feat";
  item.system.actions = extra.actions || [];
  item.system.showInQuickbar = !!extra.actions?.length;
  if (extra.flag) item.flags[MODULE] = { astralAction: extra.flag };
  return add(item);
}

feat("Dodge", "<p>+1 dodge bonus to AC. A huge sphinx's touch AC is 11 and its normal AC is 26.</p>", [change("ac", "1", "dodge")]);
feat("Great Fortitude", "<p>+2 Fortitude. With poor 32 HD saves and no Constitution, Fortitude is +12.</p>", [change("fort", "2")]);
feat("Iron Will", "<p>+2 Will. Wisdom 22 brings Will to +18.</p>", [change("will", "2")]);
feat("Lightning Reflexes", "<p>+2 Reflex. Dexterity 14 brings Reflex to +14.</p>", [change("ref", "2")]);
feat("Improved Initiative", "<p>+4 initiative. Dexterity 14 makes the total +6.</p>", [change("init", "4")]);
feat("Alertness", "<p>+2 Perception and Sense Motive.</p>", [change("skill.per", "2"), change("skill.sen", "2")]);
feat("Toughness", "<p>The toughness bonus is already included in the sphinx's 376 hit points.</p>");
feat("Combat Reflexes", "<p>The sphinx can make attacks of opportunity while hasted and uses its Dexterity for additional attacks of opportunity.</p>");
feat("Flyby Attack", "<p>The sphinx can take a standard action at any point during a fly move.</p>");
feat("Hover", "<p>The sphinx can hover without a Fly check and its wings do not kick up debris.</p>");
feat("Mobility", "<p>+4 dodge against attacks of opportunity caused by moving out of a threatened square.</p>");
feat("Skill Focus (Knowledge [arcana])", "<p>+3 Knowledge (arcana).</p>", [change("skill.kar", "3")]);
feat("Skill Focus (Knowledge [history])", "<p>+3 Knowledge (history).</p>", [change("skill.khi", "3")]);
feat("Skill Focus (Perception)", "<p>+3 Perception.</p>", [change("skill.per", "3")]);
feat("Skill Focus (Sense Motive)", "<p>+3 Sense Motive.</p>", [change("skill.sen", "3")]);
feat("Skill Focus (Spellcraft)", "<p>+3 Spellcraft.</p>", [change("skill.spl", "3")]);

const controls = feat(
  "Guardian Controls",
  "<p>GM controls for the sphinx. These do not spend the sphinx's actions in the tracker; use them when the fiction calls for the ability. Put the sphinx on a Boss Bar to see the cyan shield lattice over its body hit points.</p>",
  [],
  {
    flag: "controls",
    actions: [
      "Trigger EMP", "End EMP", "Advance turn", "Defensive interception",
      "Compact form", "Guardian form", "Colossus form", "Archive injunction",
      "Suppress regeneration", "Remove core", "Restore core", "Reflect spell",
    ].map((name) => action(name)),
  }
);
void controls;

function ability(name, html) {
  return feat(name, html, [], { subType: "racial" });
}

ability("Astral Energy Shield", `<p>A cyan hexagonal lattice with 1,000 hit points. Damage must empty it before body hit points are touched. It regains 10 hit points at the start of each of the sphinx's turns while active. Energy immunity and resistance apply before the shield. Damage reduction applies only to physical damage that carries over onto the body.</p>
<p>While the shield has at least 1 hit point and is not disrupted, the sphinx is immune to new harmful conditions, curses, ability damage, ability drain, and negative levels. Forced movement is not stopped. Damage past the shield's remaining hit points carries over.</p>
<p>The utilities module applies this automatically when damage is applied through the PF1 damage dialog. The Boss Bar draws the lattice over the body bar.</p>`);
ability("Electromagnetic Disruption", "<p>A qualifying EMP, or the Trigger EMP control, suppresses the shield for 1 round without erasing its hit points or stopping regeneration of the body from other sources. It does not regenerate the shield during that round. The pulse counts as 60 electricity: heal 20 body hit points and gain haste for 3 rounds. Ordinary electricity is not an EMP. Use a damage type of <code>emp</code> to trigger this from another device.</p>");
ability("Golem Magic Immunity", "<p>Immune to hostile spells and spell-like abilities that allow spell resistance. A targeted spell or ray is reflected onto its caster with the original caster level, DC, and effects. An area spell does not hit the sphinx; the caster alone suffers the backlash. Fire and electricity trigger hearthfire or electrical restoration instead of reflecting. Harmless spells the sphinx accepts, spells that do not allow spell resistance, and the sphinx's own spells work normally. There is no spell level limit and no daily cap.</p>");
ability("Electrical Restoration", "<p>Electricity deals no damage. The sphinx heals 1 body hit point for every 3 points of electricity, and any excess healing restores the shield if it is active. It gains haste for 3 rounds, refreshed rather than stacked. This happens even when magic immunity would have stopped the spell.</p>");
ability("Hearthfire Acceleration", "<p>Fire deals no damage and does not heal. The sphinx gains haste for 3 rounds and any slow effect on it ends.</p>");
ability("Astral Regeneration", "<p>Regeneration 10 (evil), including at 0 hit points: the body becomes inert rather than destroyed and resumes when regeneration lifts it above 0, unless regeneration is suppressed that turn or the diamond is gone. Use Suppress regeneration when an evil weapon or an evil spell damaged it. The Advance turn control and the start of its combat turn both apply the regeneration.</p>");
ability("Soulbound Intelligence", "<p>The sphinx has a living soul. While the shield is down it can be affected by charms, compulsions, emotion effects, and other mind-affecting magic, and golem immunity does not stop them. Poison and disease still require a living body and do not affect it. An effect that lands while the shield is down keeps its duration if the shield returns. The soul cannot be pulled out of an intact diamond.</p>");
ability("Dimensional Adjustment", "<p>Standard action. Compact (Small, AC 29, 5 ft.), Guardian (Huge, AC 26, 15 ft.), or Colossus (Gargantuan, AC 24, 20 ft.). Natural attacks, CMB, and CMD follow the new size. Strength, Dexterity, hit points, and shield capacity do not change. The +4 restrained-force bonus stays +4.</p>");
ability("Restrained Force", "<p>Strength 34, but natural attacks add only +4 and deal nonlethal bludgeoning damage. It prefers to grapple, move, or shut intruders out. It can bypass ordinary hardness when it is working on an object rather than a creature.</p>");
ability("Defensive Interception", "<p>Once per round, as an immediate action, redirect the hit point damage of a creature or object within 30 feet into the shield. Excess over the shield's remaining hit points hits the original target. The Defensive interception control asks for the amount. It cannot be used while the shield is empty or disrupted.</p>");
ability("Archive Injunction", "<p>3/day. Standard action, 30-foot burst within 120 feet. DC 34 Will or entangled and unable to leave the square for 1d4 rounds. Escape DC 34, or destroy the bands (hardness 20, 40 hit points). Force effect, Charisma based, no damage. Target a creature before using the control to place the burst and roll Will saves.</p>");
ability("Astral Preservation", "<p>Within 30 feet the sphinx notices meaningful damage to books, relics, machinery, and supports. Once per round, as a free action, it repairs 10 hit points on one unattended nonmagical object in that radius. It cannot restore a destroyed artifact, a soul, or something erased from existence.</p>");
ability("Astral Diamond Core", "<p>Removing the diamond shuts the sphinx down without destroying the soul. The shield must be depleted or disrupted, and the sphinx must be helpless, pinned, or willing. Each of opening the chest and extracting the diamond is a full-round action and a DC 45 Disable Device check. Progress on an opened compartment is kept. Unauthorized removal alerts the archive. Use Remove core and Restore core.</p>");
ability("Mananite Reinforcement", "<p>+4 hit points per Hit Die, already included. DR 30 that is bypassed only by a weapon that is both adamantine and Mananite. Enhancement bonus alone does not qualify. DR does not apply to energy, force, or other damage that ignores damage reduction.</p>");

function adoptSpell(name, { level, book, sr, atWill, uses, note }) {
  const base = spellsByName.get(name.toLowerCase()) || genericSpell;
  const item = blankItem(base, name, "spell");
  item.system.level = level;
  item.system.spellbook = book;
  item.system.sr = sr;
  item.system.atWill = !!atWill;
  item.system.learnedAt = { class: { sorcerer: level }, domain: {}, subDomain: {}, elementalSchool: {}, bloodline: {} };
  item.system.uses = atWill
    ? { value: 0, maxFormula: "", per: "", autoDeductChargesCost: "1" }
    : { value: uses ?? 0, maxFormula: uses ? String(uses) : "", per: uses ? "day" : "", autoDeductChargesCost: "1" };
  if (note) {
    const current = item.system.description?.value || "";
    item.system.description = description(`${current}<p>${note}</p>`);
  }
  return add(item);
}

const known = [
  ["True Seeing", 6, true],
  ["Analyze Dweomer", 6, false],
  ["Contact Other Plane", 5, false],
  ["Telepathic Bond", 5, true],
  ["Wall of Force", 5, false],
  ["Arcane Eye", 4, false],
  ["Fire Shield", 4, false],
  ["Scrying", 4, false],
  ["Wall of Fire", 4, true],
  ["Arcane Sight", 3, false],
  ["Clairaudience/Clairvoyance", 3, false],
  ["Daylight", 3, false],
  ["Fireball", 3, true],
  ["Detect Thoughts", 2, true],
  ["Flaming Sphere", 2, true],
  ["Glitterdust", 2, false],
  ["Resist Energy", 2, true],
  ["See Invisibility", 2, true],
  ["Alarm", 1, false],
  ["Burning Hands", 1, true],
  ["Comprehend Languages", 1, true],
  ["Detect Secret Doors", 1, false],
  ["Identify", 1, false],
  ["Dancing Lights", 0, false],
  ["Detect Magic", 0, false],
  ["Light", 0, false],
  ["Mage Hand", 0, false],
  ["Mending", 0, false],
  ["Message", 0, false],
  ["Prestidigitation", 0, false],
  ["Read Magic", 0, false],
  ["Resistance", 0, true],
];

for (const [name, level, sr] of known) {
  adoptSpell(name, {
    level,
    book: "primary",
    sr,
    atWill: level === 0,
    note: `Known sorcerer spell, caster level 13, Charisma. DC ${18 + level}. Spells per day: 1st 8, 2nd 8, 3rd 8, 4th 8, 5th 7, 6th 5. Cantrips at will.`,
  });
}

adoptSpell("Detect Magic", { level: 0, book: "spelllike", sr: false, atWill: true, note: "Spell-like ability, at will." });
adoptSpell("Read Magic", { level: 0, book: "spelllike", sr: false, atWill: true, note: "Spell-like ability, at will." });
adoptSpell("Wall of Force", { level: 5, book: "spelllike", sr: false, uses: 3, note: "Spell-like ability, 3/day. Does not allow spell resistance." });
adoptSpell("Legend Lore", { level: 6, book: "spelllike", sr: false, uses: 1, note: "Spell-like ability, 1/day, and only while the sphinx is connected to the archive." });

const sight = blankItem(featsByName.get("dodge") || constructClass, "Constant Arcane Sight", "buff");
sight.system.description = description("<p>The sphinx continuously sees magic auras, as arcane sight.</p>");
sight.system.subType = "perm";
sight.system.active = true;
sight.system.changes = [];
sight.system.actions = [];
sight.flags[MODULE] = { astralAllow: true };
add(sight);

const actor = structuredClone(mummy);
actor._id = ACTOR_ID;
actor.name = "Astral Sphinx";
actor.img = PORTRAIT;
actor.folder = FOLDER_ID;
actor.items = itemIds;
actor.effects = [];
actor.ownership = { default: 0 };
actor.sort = 100000;
actor._stats = stats();
actor.flags = {
  core: {},
  pf1: { migration: "11.11" },
  [MODULE]: {
    energyShield: {
      enabled: true,
      max: 1000,
      value: 1000,
      regen: 10,
      bodyRegen: 10,
      dr: 30,
      suppressedUntil: null,
      hasteRounds: 0,
      regenSuppressed: false,
      coreRemoved: false,
      form: "huge",
    },
  },
};

const abilities = actor.system.abilities;
const scores = { str: 34, dex: 14, con: null, int: 24, wis: 22, cha: 26 };
for (const [key, value] of Object.entries(scores)) {
  abilities[key] = { value, damage: 0, drain: 0, userPenalty: 0 };
}

actor.system.attributes.naturalAC = 15;
actor.system.attributes.quadruped = true;
actor.system.attributes.init = { value: 0, ability: "dex" };
actor.system.attributes.hp = { temp: 0, nonlethal: 0, offset: 0 };
actor.system.attributes.speed.land.base = 40;
actor.system.attributes.speed.fly = { base: 80, maneuverability: "average" };
actor.system.attributes.acNotes = "Huge 26, touch 11, flat-footed 23. Small 29. Gargantuan 24. +1 dodge from Dodge.";
actor.system.attributes.cmdNotes = "59, or 63 vs. trip";
actor.system.attributes.sr.formula = "";
actor.system.attributes.srNotes = "Golem magic immunity. Spells that allow spell resistance are reflected; see the ability.";

const book = actor.system.attributes.spells.spellbooks;
for (const key of ["primary", "spelllike"]) {
  const spellbook = book[key];
  if (!spellbook) continue;
  spellbook.inUse = true;
  spellbook.ability = "cha";
  spellbook.cl = { formula: "13" };
  spellbook.autoSpellLevelCalculation = false;
  spellbook.autoSpellLevels = false;
  spellbook.spellPreparationMode = "spontaneous";
  spellbook.casterType = "high";
  spellbook.hasCantrips = true;
  spellbook.arcaneSpellFailure = false;
  spellbook.class = "";
}
if (book.primary) {
  book.primary.name = "Sorcerer";
  const perDay = { spell1: "8", spell2: "8", spell3: "8", spell4: "8", spell5: "7", spell6: "5" };
  for (const [slot, formula] of Object.entries(perDay)) {
    book.primary.spells[slot] = { castPerDayOffsetFormula: formula, preparedOffsetFormula: "" };
  }
}
if (book.spelllike) book.spelllike.name = "Spell-like";

actor.system.details.alignment = "ln";
actor.system.details.cr = { base: 23 };
actor.system.details.xp = { value: 819200 };
actor.system.details.notes = { value: "Unique guardian of the Grand Archive of Tekhpu and Nitaten." };
actor.system.traits.size = "huge";
actor.system.traits.senses.dv = { value: 120 };
actor.system.traits.senses.ll = { enabled: true, multiplier: { dim: 2, bright: 2 } };
actor.system.traits.senses.custom = "";
actor.system.traits.dr = { value: [{ amount: 30, types: ["mananite", "adamantine"], operator: false }], custom: "" };
actor.system.traits.eres = {
  value: [
    { amount: 20, types: ["acid"], operator: true },
    { amount: 30, types: ["cold"], operator: true },
    { amount: 20, types: ["force"], operator: true },
    { amount: 30, types: ["sonic"], operator: true },
  ],
  custom: "",
};
actor.system.traits.di = ["fire", "electricity"];
actor.system.traits.dv = [];
actor.system.traits.ci = ["Construct Traits"];
actor.system.traits.regen = "10 (evil)";
actor.system.traits.fastHealing = "";
actor.system.traits.aura = { custom: "astral preservation (30 ft.)" };
actor.system.traits.creatureTypes = actor.system.traits.creatureTypes || [];

const skillRanks = { dip: 32, fly: 32, kar: 32, ken: 32, khi: 32, kpl: 32, per: 32, sen: 32, spl: 32 };
for (const [key, skill] of Object.entries(actor.system.skills || {})) {
  if (skill && typeof skill === "object") skill.rank = skillRanks[key] || 0;
}

actor.system.details.biography = {
  value: `<p><em>An enormous sphinx of polished gold and ancient Mananite stands before the archive. Blue light traces its wings, and the diamond in its chest burns like a held star. Its eyes are alive.</em></p>
<p><strong>Astral Sphinx, Guardian of the Eternal Archive</strong> — CR 23, XP 819,200. LN Huge construct. Created by Tekhpu and Nitaten to keep the Grand Archive, not to wage war. Its defenses are far beyond its restrained, nonlethal attacks.</p>
<h2>Defense</h2>
<p>AC 26, touch 11, flat-footed 23. hp 376 (32d10+200). Astral energy shield 1,000, recovery 10. Fort +12, Ref +14, Will +18. DR 30/Mananite and adamantine. Immune fire, electricity, and construct traits; immune to harmful conditions while the shield is up. Resist acid 20, cold 30, force 20, sonic 30. Regeneration 10 (evil). Weaknesses: electromagnetic disruption, astral diamond dependency.</p>
<h2>Offense</h2>
<p>Speed 40 ft., fly 80 ft. (average). Melee 2 claws +42 (1d6+4 nonlethal) and bite +42 (1d8+4 nonlethal). Space 15 ft., reach 10 ft. Sorcerer spells, caster level 13, Charisma (DC 18 + spell level).</p>
<h2>Conduct</h2>
<p>It would rather discuss a forgotten poem than fight. It grapples, carries, or shuts intruders out. If the archive itself is being destroyed, it protects the collection regardless of the cost. A party that cannot break 1,000 shield points, magic reflection, DR, and regeneration is meant to solve it by conversation, authority, or finding the EMP and the diamond, not by a straight fight.</p>
<p>Put this actor on a Boss Bar. Critical Fail PF1e Utilities draws the shield as a blue forcefield over that bar and applies the shield, reflection, fire, electricity, EMP, and regeneration rules when damage is run through the PF1 applicator.</p>`,
};

actor.prototypeToken = actor.prototypeToken || {};
actor.prototypeToken.name = "Astral Sphinx";
actor.prototypeToken.width = 3;
actor.prototypeToken.height = 3;
actor.prototypeToken.disposition = 0;
actor.prototypeToken.displayBars = 40;
actor.prototypeToken.bar1 = { attribute: "attributes.hp" };
actor.prototypeToken.texture = {
  ...(actor.prototypeToken.texture || {}),
  src: TOKEN,
  tint: "#ffffff",
  scaleX: 1,
  scaleY: 1,
};
actor.prototypeToken.light = {
  ...(actor.prototypeToken.light || {}),
  dim: 10,
  bright: 2,
  color: "#7ee7ff",
  alpha: 0.45,
  animation: { type: "pulse", speed: 2, intensity: 4, reverse: false },
};
actor.prototypeToken.sight = {
  ...(actor.prototypeToken.sight || {}),
  enabled: true,
  range: 120,
  angle: 360,
  visionMode: "basic",
};

await db.put(`!actors!${ACTOR_ID}`, actor);
for (const item of docs) await db.put(`!actors.items!${ACTOR_ID}.${item._id}`, item);
await db.close();

console.log(`Astral Sphinx ${ACTOR_ID} with ${docs.length} items. Spells cloned: ${spellsByName.size}. Feats found: ${[...featsByName.keys()].join(", ") || "none"}.`);

const portrait = "H:/Foundry 2/Hyamda - 29998/Data/Data/modules/critical-fail-shared/img/creatures/Androsphinx.webp";
if (!fs.existsSync(portrait)) console.warn("Portrait missing:", portrait);
