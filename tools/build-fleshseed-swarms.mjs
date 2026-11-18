/**
 * Fleshseed Swarms for Foundry V13 / PF1 11.11.
 * Inserts three swarm actors into Azure Realms Monsters, in the Voremind folder.
 * Usage: node tools/build-fleshseed-swarms.mjs <packDir>
 */
import { ClassicLevel } from "file:///H:/Foundry%202/FoundryVTT-Node-13.351/node_modules/classic-level/index.js";
import crypto from "crypto";

const packDir = process.argv[2];
if (!packDir) {
  console.error("Usage: node tools/build-fleshseed-swarms.mjs <packDir>");
  process.exit(1);
}

const IMG = "modules/critical-fail-shared/img/creatures/voremind/fleshseed-swarm.webp";
const TOKEN = "modules/critical-fail-shared/img/creatures/voremind/fleshseed-swarm-token.webp";
const FOLDER = "CfFloodFolder001";
const NOW = Date.now();

const VARIANTS = [
  {
    id: "CfFsSwarmLarge01",
    key: "Lg",
    name: "Fleshseed Swarm, Large",
    cr: 4,
    xp: 1200,
    hd: 6,
    hp: 27,
    squares: 2,
    count: "about 300",
    area: "10-foot square",
    speed: [30, 20],
    abilities: { str: 3, dex: 18, con: 16, int: 1, wis: 12, cha: 3 },
    senses: { dv: 60, scent: 0, tr: 0 },
    ranks: { per: 3, ste: 0 },
    fastHealing: "",
    damage: [{ formula: "2d6", types: ["piercing"] }],
    damageText: "2d6 piercing",
    dc: 16,
    latchDc: 17,
    flavor: "A writhing carpet of fist-sized parasites advances across the ground, their tendrils intertwining as hundreds of tiny mouths chatter in perfect unison.",
    conduct: "It comes out of corridors, vents, and the gap under a door. It stays on the lightly armored ones long enough for Assimilating Blight to take hold.",
    extras: ["swarmingLatch", "scuttlingWave"],
    feats: ["improvedInitiative", "skillFocusStealth", "toughness"]
  },
  {
    id: "CfFsSwarmHuge001",
    key: "Hg",
    name: "Fleshseed Swarm, Huge",
    cr: 7,
    xp: 3200,
    hd: 11,
    hp: 49,
    squares: 3,
    count: "about 700",
    area: "15-foot square",
    speed: [40, 30],
    abilities: { str: 3, dex: 20, con: 20, int: 2, wis: 14, cha: 3 },
    senses: { dv: 60, scent: 30, tr: 0 },
    ranks: { per: 11, ste: 0 },
    fastHealing: "",
    damage: [
      { formula: "3d6", types: ["piercing"] },
      { formula: "1d6", types: ["acid"] }
    ],
    damageText: "3d6 piercing plus 1d6 acid",
    dc: 20,
    flavor: "Hundreds of Fleshseeds pour over one another in a surging mass. Their tendrils bind together into grasping cords, while the creatures beneath push their companions over obstacles and toward anything that moves.",
    conduct: "It climbs, bridges small gaps, and cuts off the way out. It holds the dangerous ones in place and piles onto the casters.",
    extras: ["bindingTendrils", "coordinatedConsumption", "acidicSecretions"],
    feats: ["greatFortitude", "improvedInitiative", "ironWill", "skillFocusPerception", "skillFocusStealth", "toughness"]
  },
  {
    id: "CfFsSwarmGarg001",
    key: "Gg",
    name: "Fleshseed Swarm, Gargantuan",
    cr: 10,
    xp: 9600,
    hd: 16,
    hp: 72,
    squares: 4,
    count: "about 1,200",
    area: "20-foot square",
    speed: [40, 30],
    abilities: { str: 3, dex: 22, con: 24, int: 3, wis: 16, cha: 5 },
    senses: { dv: 120, scent: 30, tr: 30 },
    ranks: { per: 16, ste: 0 },
    fastHealing: "10",
    damage: [
      { formula: "4d6", types: ["piercing"] },
      { formula: "2d6", types: ["acid"] }
    ],
    damageText: "4d6 piercing plus 2d6 acid",
    dc: 25,
    flavor: "The floor vanishes beneath a tide of living creatures. Thousands of limbs move with an unnatural rhythm as the Fleshseeds form towering waves of intertwined parasites.",
    conduct: "It fills the room, surrounds the armored ones, and drives the casters into the mass. Assimilation Tempest is for anything that breaks out of the occupied area. It fights with Broodminds and the larger Voremind.",
    extras: ["assimilationTempest", "overwhelmingTide", "livingReconstruction", "greaterCommunion"],
    feats: ["abilityFocus", "greatFortitude", "improvedInitiative", "ironWill", "lightningReflexes", "skillFocusPerception", "skillFocusStealth", "toughness"]
  }
];

const BLIGHT = `<p><strong>Assimilating Blight</strong> is an extraordinary biological disease, delivered by the swarm's damage. Onset 1 round. Frequency 1/round for 6 rounds. Effect 1d2 Constitution damage and 1d2 Wisdom damage, and sickened for 1 round on each failed save. Cure 2 consecutive Fortitude saves. A creature that dies while infected becomes a Reclaimed after 1d4 rounds if the body is intact enough. Repeat exposure does not stack; use the highest DC. <em>Remove disease</em> ends it before the body changes.</p>`;

const SPECIES = `<p>Every Fleshseed in the swarm is Tiny. The Large, Huge, and Gargantuan names are the swarm's footprint, not the size of one parasite. It is a living aberration, not undead. Positive energy heals it. Negative energy harms it. Channel energy used against undead does not affect it. It is immune to Assimilating Blight and not immune to other diseases. Mind-affecting effects can still affect it. Swarm traits replace the normal critical-hit and combat-maneuver rules.</p>`;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sid() {
  return crypto.randomBytes(8).toString("hex");
}

function itemId(key, n) {
  return `CfFs${key}${String(n).padStart(10, "0")}`;
}

function ability(value) {
  return { value, damage: 0, drain: 0, userPenalty: 0 };
}

function featFrom(template, { id, name, description, changes = [], tags }) {
  const item = clone(template);
  item._id = id;
  item.name = name;
  item.sort = NOW;
  item.effects = [];
  item.folder = null;
  item.system.description = { value: description, instructions: "", unidentified: "" };
  item.system.changes = changes.map((change) => ({
    _id: sid().slice(0, 8),
    formula: change.formula,
    operator: "add",
    priority: 0,
    target: change.target,
    type: "untyped"
  }));
  item.system.actions = [];
  if (tags) item.system.tags = tags;
  item.system.tag = "";
  return item;
}

function p(text) {
  return `<p>${text}</p>`;
}

const EXTRA = {
  swarmingLatch: (v) => p(`<strong>Swarming Latch (Ex).</strong> Once a round, a creature damaged by the swarm saves Reflex DC ${v.latchDc} or is covered in clinging Fleshseeds and takes a −2 penalty to AC until the start of its next turn. The penalty does not stack.`),
  scuttlingWave: () => p("<strong>Scuttling Wave (Ex).</strong> Three times a day, as a swift action, the swarm shifts its occupied area up to 5 feet without provoking. The area stays one contiguous block."),
  bindingTendrils: (v) => p(`<strong>Binding Tendrils (Ex).</strong> A creature damaged by the swarm saves Reflex DC ${v.dc} or is entangled. It stays entangled until it leaves the swarm's area, or it spends a standard action and succeeds at a DC ${v.dc} Strength or Escape Artist check. This is not a grapple.`),
  coordinatedConsumption: (v) => p(`<strong>Coordinated Consumption (Ex).</strong> Once a round, if at least two enemies are inside the swarm, it may concentrate on one of them when the swarm damage is resolved. That creature takes an extra 2d6 piercing damage, Reflex DC ${v.dc} half.`),
  acidicSecretions: () => p("<strong>Acidic Secretions (Ex).</strong> Digestive enzymes add 1d6 acid to the swarm damage."),
  assimilationTempest: (v) => p(`<strong>Assimilation Tempest (Ex).</strong> Once every 1d4 rounds, as a standard action, the swarm flings Fleshseeds out to 60 feet. A 10-foot-radius burst deals 4d6 piercing damage, Reflex DC ${v.dc} half. A creature that fails that save also saves Fortitude DC ${v.dc} against Assimilating Blight. The swarm does not lose hit points.`),
  overwhelmingTide: () => p("<strong>Overwhelming Tide (Ex).</strong> Every square the swarm occupies is difficult terrain for enemies, including creatures that ignore ordinary difficult terrain. Creatures in the swarm cannot take a 5-foot step unless they are immune to this effect."),
  livingReconstruction: () => p("<strong>Living Reconstruction (Ex).</strong> Fast healing 10. Fire or acid damage suppresses the fast healing until the end of the swarm's next turn."),
  greaterCommunion: () => p("<strong>Greater Synaptic Communion (Ex).</strong> The swarm shares what it perceives with other Voremind within 1 mile. Allied Voremind within 60 feet gain a +2 insight bonus on Perception checks and initiative checks.")
};

const FEAT = {
  improvedInitiative: (v, template) => featFrom(template, {
    id: "",
    name: "Improved Initiative",
    description: p("The swarm rolls initiative with a +4 bonus."),
    changes: [{ formula: "4", target: "init" }],
    tags: ["Combat"]
  }),
  toughness: (v, template) => featFrom(template, {
    id: "",
    name: "Toughness",
    description: p("The swarm gains extra hit points equal to its Hit Dice."),
    changes: [{ formula: "max(3, @attributes.hd.total)", target: "mhp" }],
    tags: ["Combat"]
  }),
  greatFortitude: (v, template) => featFrom(template, {
    id: "",
    name: "Great Fortitude",
    description: p("+2 bonus on Fortitude saves."),
    changes: [{ formula: "2", target: "fort" }],
    tags: ["Combat"]
  }),
  ironWill: (v, template) => featFrom(template, {
    id: "",
    name: "Iron Will",
    description: p("+2 bonus on Will saves."),
    changes: [{ formula: "2", target: "will" }],
    tags: ["Combat"]
  }),
  lightningReflexes: (v, template) => featFrom(template, {
    id: "",
    name: "Lightning Reflexes",
    description: p("+2 bonus on Reflex saves."),
    changes: [{ formula: "2", target: "ref" }],
    tags: ["Combat"]
  }),
  skillFocusStealth: (v, template) => featFrom(template, {
    id: "",
    name: "Skill Focus (Stealth)",
    description: p("+3 bonus on Stealth checks. The swarm's written bonus stays +3 even when it has 10 or more ranks."),
    changes: [{ formula: "3", target: "skill.ste" }],
    tags: ["General"]
  }),
  skillFocusPerception: (v, template) => featFrom(template, {
    id: "",
    name: "Skill Focus (Perception)",
    description: p("+3 bonus on Perception checks. The swarm's written bonus stays +3 even when it has 10 or more ranks."),
    changes: [{ formula: "3", target: "skill.per" }],
    tags: ["General"]
  }),
  abilityFocus: (v, template) => featFrom(template, {
    id: "",
    name: "Ability Focus (Assimilation Tempest)",
    description: p(`Assimilation Tempest uses DC ${v.dc}, already included in that ability.`),
    tags: ["Monster"]
  })
};

const db = new ClassicLevel(packDir, { keyEncoding: "utf8", valueEncoding: "json" });
await db.open();

const flesh = await db.get("!actors!CfFloodInfect001");
const fleshItems = [];
for (const id of flesh.items || []) fleshItems.push(await db.get(`!actors.items!CfFloodInfect001.${id}`));
const scorpion = await db.get("!actors!7xhZey3ByTTZr1lj");
const scorpionItems = [];
for (const id of scorpion.items || []) scorpionItems.push(await db.get(`!actors.items!7xhZey3ByTTZr1lj.${id}`));

const classTemplate = fleshItems.find((item) => item.type === "class");
const raceTemplate = fleshItems.find((item) => item.type === "race");
const traitTemplate = fleshItems.find((item) => item.name === "Voremind Traits");
const communionTemplate = fleshItems.find((item) => item.name === "Synaptic Communion");
const attackTemplate = scorpionItems.find((item) => item.name === "Swarm" && item.type === "attack");
const swarmTraitTemplate = scorpionItems.find((item) => item.name === "Swarm Traits");
const featTemplate = scorpionItems.find((item) => item.name === "Improved Initiative");

let n = 0;
for (const variant of VARIANTS) {
  const oldItems = [];
  const existing = await db.get(`!actors!${variant.id}`).catch(() => null);
  if (existing) {
    for await (const [key] of db.iterator({
      gte: `!actors.items!${variant.id}.`,
      lt: `!actors.items!${variant.id}.~`
    })) oldItems.push(key);
    for await (const [key] of db.iterator({
      gte: `!actors.effects!${variant.id}.`,
      lt: `!actors.effects!${variant.id}.~`
    })) oldItems.push(key);
  }

  const actor = clone(flesh);
  actor._id = variant.id;
  actor.name = variant.name;
  actor.folder = FOLDER;
  actor.img = IMG;
  actor.sort = NOW + n;
  actor.effects = [];
  actor.prototypeToken.name = variant.name;
  actor.prototypeToken.width = variant.squares;
  actor.prototypeToken.height = variant.squares;
  actor.prototypeToken.texture.src = TOKEN;
  actor.prototypeToken.texture.scaleX = 1;
  actor.prototypeToken.texture.scaleY = 1;
  if (actor._stats) {
    actor._stats.modifiedTime = NOW;
    actor._stats.createdTime = actor._stats.createdTime || NOW;
    actor._stats.systemVersion = actor._stats.systemVersion || "11.11";
  }

  const system = actor.system;
  system.details.alignment = "ne";
  system.details.cr = { base: variant.cr };
  system.details.xp = { value: variant.xp };
  system.details.notes = { value: `${variant.count} Fleshseeds. Occupies a ${variant.area}.` };
  system.details.biography = {
    value: [
      p(`<em>${variant.flavor}</em>`),
      p(`<strong>${variant.name}</strong> — CR ${variant.cr}, XP ${variant.xp.toLocaleString("en-US")}. ${variant.count} Tiny Fleshseeds in a ${variant.area}.`),
      "<h2>Conduct</h2>",
      p(variant.conduct),
      "<h2>Species</h2>",
      SPECIES,
      BLIGHT,
      p("Swarm damage is automatic at the end of the swarm's movement against creatures whose space it occupies. It does not threaten squares and does not make attacks of opportunity. A living creature that starts its turn in the swarm and is vulnerable to the damage saves Fortitude or is nauseated for 1 round (distraction).")
    ].join("\n")
  };
  system.traits.size = "tiny";
  system.traits.ci = ["Swarm Traits"];
  system.traits.fastHealing = variant.fastHealing;
  system.traits.senses.dv.value = variant.senses.dv;
  system.traits.senses.sc.value = variant.senses.scent;
  system.traits.senses.tr.value = variant.senses.tr;
  system.attributes.speed.land.base = variant.speed[0];
  system.attributes.speed.climb.base = variant.speed[1];
  system.attributes.hp.offset = 0;
  for (const key of Object.keys(variant.abilities)) {
    system.abilities[key] = ability(variant.abilities[key]);
  }
  if (system.skills?.per) system.skills.per.rank = variant.ranks.per;
  if (system.skills?.ste) system.skills.ste.rank = variant.ranks.ste;

  const items = [];
  let seq = 1;
  const nextId = () => itemId(variant.key, seq++);

  const hd = clone(classTemplate);
  hd._id = nextId();
  hd.system.level = variant.hd;
  hd.system.hp = variant.hp;
  items.push(hd);

  const race = clone(raceTemplate);
  race._id = nextId();
  race.name = "Aberration (Voremind, Swarm)";
  race.system.size = "tiny";
  race.system.description = { value: p("Tiny living parasites massed into one swarm. The voremind and swarm subtypes are the same species and the swarm form."), instructions: "", unidentified: "" };
  items.push(race);

  const traits = clone(traitTemplate);
  traits._id = nextId();
  items.push(traits);

  const swarmTraits = clone(swarmTraitTemplate);
  swarmTraits._id = nextId();
  items.push(swarmTraits);

  items.push(featFrom(communionTemplate, {
    id: nextId(),
    name: "Collective Immunity",
    description: p("Immune to Assimilating Blight and other Voremind infestation effects. Other living-aberration weaknesses remain."),
    tags: ["Racial"]
  }));

  const communion = variant.extras.includes("greaterCommunion")
    ? EXTRA.greaterCommunion(variant)
    : p("Voremind within 300 feet share what any one of them has perceived. They know the location, not line of sight, and they do not ignore concealment.");
  items.push(featFrom(communionTemplate, {
    id: nextId(),
    name: variant.extras.includes("greaterCommunion") ? "Greater Synaptic Communion" : "Synaptic Communion",
    description: communion,
    tags: ["Racial"]
  }));

  items.push(featFrom(featTemplate, {
    id: nextId(),
    name: "Distraction",
    description: p(`A living creature vulnerable to the swarm's damage that starts its turn in the swarm saves Fortitude DC ${variant.dc} or is nauseated for 1 round.`),
    tags: ["Universal Monster Rules"]
  }));

  items.push(featFrom(featTemplate, {
    id: nextId(),
    name: "Assimilating Blight",
    description: p(`Fortitude DC ${variant.dc}. ${BLIGHT}`),
    tags: ["Racial"]
  }));

  for (const extra of variant.extras) {
    if (extra === "greaterCommunion") continue;
    items.push(featFrom(featTemplate, {
      id: nextId(),
      name: extra.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase()).trim(),
      description: EXTRA[extra](variant),
      tags: ["Racial"]
    }));
  }

  for (const featName of variant.feats) {
    const feat = FEAT[featName](variant, featTemplate);
    feat._id = nextId();
    items.push(feat);
  }

  const attack = clone(attackTemplate);
  attack._id = nextId();
  attack.name = "Swarm";
  attack.system.description = {
    value: p(`Automatic swarm damage at the end of the swarm's movement: ${variant.damageText}, plus Assimilating Blight DC ${variant.dc}. No attack roll. Reach 0. The swarm occupies a ${variant.area}.`),
    instructions: "",
    unidentified: ""
  };
  const action = attack.system.actions[0];
  action._id = sid();
  action.name = "Swarm";
  action.attackName = "Swarm";
  action.actionType = "other";
  action.attackBonus = "";
  action.damage = { parts: variant.damage };
  action.notes = {
    effect: ["assimilating blight", "distraction"],
    footer: [`swarm (${variant.damageText} plus assimilating blight)`]
  };
  items.push(attack);

  actor.items = items.map((item) => item._id);
  await db.put(`!actors!${variant.id}`, actor);
  for (const key of oldItems) await db.del(key);
  for (const item of items) await db.put(`!actors.items!${variant.id}.${item._id}`, item);
  n += 1;
  console.log("wrote", variant.name, variant.id, "items", items.length);
}

await db.close();
console.log("done", n);
