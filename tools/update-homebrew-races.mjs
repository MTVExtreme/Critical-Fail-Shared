/**
 * Updates campaign races in Critical Fail Shared from the homebrew race document.
 * Races that already exist in azure-realms-items are updated in place (same id
 * and icon). Only races missing from both that pack and the stock PF1 race list
 * are added. Copies that were previously inserted into the PF1 system race pack
 * are removed.
 *
 *   node tools/update-homebrew-races.mjs --dry
 *   node tools/update-homebrew-races.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("F:/Code/Foundry Code/package.json");
const { ClassicLevel } = require("classic-level");

const DOC = process.argv.find((arg) => arg.endsWith(".txt"))
  ?? "C:/Users/mtv19/.cursor/projects/C-Users-mtv19-AppData-Local-Temp-6701c253-a9dd-4db6-a217-d9727c0c4943/agent-tools/9de84f34-1dc3-48ff-8770-3592a17150f5.txt";
const DRY = process.argv.includes("--dry");
const SHARED_SOURCE = "F:/Code/CriticalFailShared/Critical-Fail-Shared/packs/azure-realms-items";
const SHARED_OUTPUTS = [
  "F:/Code/CriticalFailShared/Critical-Fail-Shared/packs/azure-realms-items",
  "H:/Foundry 2/Hyamda - 29998/Data/Data/modules/critical-fail-shared/packs/azure-realms-items"
];
const SYSTEM_OUTPUTS = [
  "H:/Foundry 2/Hyamda - 29998/Data/Data/systems/pf1/packs/races",
  "F:/Code/pf1/packs/races"
];
const ORIGINAL_SYSTEM = process.env.TEMP + "/pf1-races-original-probe";
const FOLDERS_BY_HINT = [
  [/kitsune/i, "MZv3mlVYGSEB87fd"],
  [/dwarf/i, "pcNt5UkbrPPoOhlq"],
  [/racosa/i, "jx6YJPu7a0OWh3Jk"],
  [/neko/i, "qWNdTeqDEmkgQZoV"],
  [/wolf/i, "eOTJSdNll2UkgKls"],
  [/tengu/i, "XF3cKQTcouXvlVlt"],
  [/gnome/i, "NEtIkeN05bcO5Fhj"],
  [/bunny/i, "TG0vUl9z0TxieSM7"],
  [/lizard|agami|calumma|eute|komodo|shelldine|sobeq|tokay/i, "EbGt2KlHzkG0DrQW"],
  [/orc/i, "eHOlX019UCcNXOTa"],
  [/anvac/i, "FmBFVGTgh3bEZRk1"]
];
const AZURE_RACES = "MpRgmx5hb3tJwNRW";
const FORCE_MATCH = new Map([
  ["anvac android", ["AnVAc"]],
  ["dwarf subtype - azerbloods", ["Azerbloods"]]
]);

const ABILITIES = {
  strength: "str", str: "str",
  dexterity: "dex", dex: "dex",
  constitution: "con", con: "con",
  intelligence: "int", int: "int",
  wisdom: "wis", wis: "wis",
  charisma: "cha", cha: "cha"
};
const SKILLS = [
  ["perception", "skill.per"],
  ["sense motive", "skill.sen"],
  ["spellcraft", "skill.spl"],
  ["use magic device", "skill.umd"],
  ["escape artist", "skill.esc"],
  ["disable device", "skill.dev"],
  ["handle animal", "skill.han"],
  ["knowledge (arcana)", "skill.kar"],
  ["knowledge (nature)", "skill.kna"],
  ["knowledge (planes)", "skill.kpl"],
  ["knowledge (religion)", "skill.kre"],
  ["knowledge (local)", "skill.klo"],
  ["knowledge (dungeoneering)", "skill.kdu"],
  ["knowledge (engineering)", "skill.ken"],
  ["knowledge (geography)", "skill.kge"],
  ["knowledge (history)", "skill.khi"],
  ["knowledge (nobility)", "skill.kno"],
  ["acrobatics", "skill.acr"],
  ["diplomacy", "skill.dip"],
  ["intimidate", "skill.int"],
  ["linguistics", "skill.lin"],
  ["spellcraft", "skill.spl"],
  ["survival", "skill.sur"],
  ["stealth", "skill.ste"],
  ["bluff", "skill.blf"],
  ["disguise", "skill.dis"],
  ["climb", "skill.clm"],
  ["swim", "skill.swm"],
  ["fly", "skill.fly"],
  ["ride", "skill.rid"],
  ["heal", "skill.hea"],
  ["profession", "skill.pro"],
  ["craft", "skill.crf"]
];
const TYPES = ["monstrous humanoid", "humanoid", "outsider", "undead", "construct", "aberration", "fey", "dragon", "plant", "animal", "magical beast", "ooze"];
const SIZES = { fine: "fine", diminutive: "dim", tiny: "tiny", small: "sm", medium: "med", large: "lg", huge: "huge", gargantuan: "grg", colossal: "col" };

function foundryId(seed) {
  const hash = crypto.createHash("sha256").update(String(seed)).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += alphabet[hash[i] % alphabet.length];
  return id;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function canonical(name) {
  return name.toLowerCase().replace(/\s*-\s*base\b/g, "").replace(/\s*\(base\)/g, "").replace(/\s+/g, " ").trim();
}

function isRaceHeader(line) {
  const text = line.trim();
  if (!text || text.length > 90 || text.includes(":") || text.includes(".")) return false;
  if (/^[*•\-]/.test(text) || /^\d/.test(text)) return false;
  if (/^(replaces|standard|alternate|physical|other|defense|feat|movement|offense|senses|magical)\b/i.test(text)) return false;
  if (/subtype\s*\(/i.test(text) && !/^dwarf subtype/i.test(text)) return false;
  return /\((?:[^)]*(?:\bRP\b|\d\s*RP|\bCR\b)[^)]*|Base)\)(?:\s*(?:\[[^\]]+\]|\([^)]+\)))*\s*$/i.test(text);
}

function displayName(header) {
  return header
    .replace(/\s*\((?:[^)]*(?:\bRP\b|\d\s*RP|\bCR\b)[^)]*|Base)\)/gi, "")
    .replace(/\s*\[[^\]]+\]/g, "")
    .replace(/\s*\([^)]*(?:special|family trait)[^)]*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDocument(raw) {
  const body = raw.split(/_{5,}/).slice(1).join("\n");
  const lines = body.split(/\r?\n/);
  const races = [];
  let current = null;
  for (const line of lines) {
    if (isRaceHeader(line)) {
      if (current) races.push(current);
      current = { header: line.trim(), name: displayName(line.trim()), lines: [] };
    } else if (current) current.lines.push(line);
  }
  if (current) races.push(current);
  return races.filter((race) => race.name.length > 1);
}

function standardTraitText(lines) {
  const unit = lines.findIndex((line) => /^[A-Z] \(/.test(line.trim()) && /Unit:/.test(line));
  const limited = unit >= 0 ? lines.slice(0, unit) : lines;
  const text = limited.join("\n");
  const start = text.search(/standard racial traits|racial traits/i);
  const sliced = start >= 0 ? text.slice(start) : text;
  const end = sliced.search(/\n\s*alternate (?:racial )?traits\b/i);
  return end >= 0 ? sliced.slice(0, end) : sliced;
}

function descriptionHtml(race) {
  const parts = [`<p><em>Campaign homebrew race. Alternate racial traits are listed below and are not applied until chosen.</em></p>`];
  let list = [];
  const flush = () => {
    if (!list.length) return;
    parts.push(`<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const line of race.lines) {
    const text = line.trim();
    if (!text) {
      flush();
      continue;
    }
    if (/^(standard racial traits|alternate racial traits|alternate traits|defense racial traits|feat and skill racial traits|movement racial traits|offense racial traits|senses racial traits|magical racial traits|other racial traits|physical description)$/i.test(text)) {
      flush();
      parts.push(`<h3>${escapeHtml(text)}</h3>`);
      continue;
    }
    if (text.startsWith("*") || text.startsWith("•")) {
      list.push(text.replace(/^[*\u2022]\s*/, ""));
      continue;
    }
    if (/^replaces\b/i.test(text)) {
      flush();
      parts.push(`<p><strong>${escapeHtml(text)}</strong></p>`);
      continue;
    }
    flush();
    parts.push(`<p>${escapeHtml(text)}</p>`);
  }
  flush();
  return parts.join("");
}

function parseAbilities(traits) {
  const line = traits.match(/ability score[^:\n]*:\s*([^\n]+)/i)?.[1];
  if (!line) return [];
  const found = [];
  const re = /([+-]|–|−)?\s*(\d+)\s*(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)\b/gi;
  let match;
  while ((match = re.exec(line))) {
    const sign = match[1] === "-" || match[1] === "–" || match[1] === "−" ? -1 : 1;
    const target = ABILITIES[match[3].toLowerCase()];
    found.push({ target, formula: String(sign * Number(match[2])) });
  }
  return found;
}

function traitLineAt(traits, index) {
  const start = traits.lastIndexOf("\n", index);
  const end = traits.indexOf("\n", index);
  return traits.slice(start + 1, end === -1 ? traits.length : end);
}

function parseSkills(traits) {
  const bonuses = new Map();
  const labels = [...SKILLS].sort((a, b) => b[0].length - a[0].length);
  const re = /\+\s*(\d+)\s+(?:racial\s+)?bonus (?:on|to) ([^.\n]+?) checks/gi;
  const conditional = /to appear|to identify|to gather|to find|in forests|in jungles|while |when |against |instead|related to/i;
  let match;
  while ((match = re.exec(traits))) {
    const window = traits.slice(match.index, match.index + match[0].length + 48).split(/[.]/)[0];
    if (conditional.test(window)) continue;
    const line = traitLineAt(traits, match.index);
    const totalBonus = line.match(/total \+(\d+)\s+bonus/i);
    const amount = totalBonus ? Number(totalBonus[1]) : Number(match[1]);
    const after = traits.slice(match.index + match[0].length, match.index + match[0].length + 48);
    const madeWith = after.match(/^\s*made with ([^.\n]+)/i)?.[1] ?? "";
    for (const source of [match[2], madeWith]) {
      if (!source) continue;
    for (const part of source.toLowerCase().split(/,|\band\b|\bor\b/)) {
      const cleaned = part.replace(/^(?:a|an|their|all)\s+/g, "").trim();
      const skill = labels.find(([label]) => cleaned === label || cleaned.startsWith(`${label} `) || cleaned.startsWith(`${label}(`));
      if (!skill) continue;
      const current = bonuses.get(skill[1]) ?? { racial: 0, other: 0 };
      if (/racial/i.test(match[0])) current.racial = Math.max(current.racial, amount);
      else current.other += amount;
      bonuses.set(skill[1], current);
    }
    }
  }
  return [...bonuses.entries()].map(([target, slot]) => ({ target, formula: String(slot.racial + slot.other) }));
}

function parseMechanics(traits) {
  const changes = [...parseAbilities(traits), ...parseSkills(traits)];
  const notes = [];
  const speed = Number(traits.match(/(?:base |normal )?speed of (\d+)\s*feet/i)?.[1]
    ?? traits.match(/base speed:\s*(?:normal\s+)?(\d+)\s*ft/i)?.[1]
    ?? "") || null;
  const fly = traits.match(/fly speed of (\d+)\s*feet(?:\s+with\s+(\w+)\s+maneuverability)?/i);
  const sizeWord = (traits.match(/\bare\s+(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/i)?.[1]
    ?? traits.match(/\bsize:\s*(Fine|Diminutive|Tiny|Small|Medium|Large|Huge|Gargantuan|Colossal)\b/i)?.[1])?.toLowerCase();
  const typeLine = traits.match(/type:\s*([^\n]+)/i)?.[1]?.toLowerCase() ?? "";
  const creatureTypes = [];
  let typeRest = typeLine;
  for (const type of TYPES) {
    if (!typeRest.includes(type)) continue;
    creatureTypes.push(type === "monstrous humanoid" ? "monstrousHumanoid" : type);
    typeRest = typeRest.replace(type, "");
  }
  const subtypes = [];
  const subtypeMatch = typeLine.match(/with the ([^.]+?) subtypes?/);
  if (subtypeMatch) {
    for (const part of subtypeMatch[1].split(/\s+and\s+|,\s*/)) {
      const subtype = part.replace(/\bsubtype\b/g, "").trim();
      if (subtype && !/humanoid|fey|outsider/.test(subtype)) subtypes.push(subtype);
    }
  }
  if (!subtypes.length) {
    const paren = typeLine.match(/\(([^)]+)\)/)?.[1] ?? "";
    if (paren && paren.length < 40 && !/\brp\b|\d/i.test(paren)) {
      for (const part of paren.split(/,|\band\b/)) {
        const subtype = part.trim();
        if (subtype) subtypes.push(subtype);
      }
    }
  }
  const languages = [];
  const langLine = traits.match(/(?:speaking|begins? play speaking)\s+([^.]+)/i)?.[1];
  if (langLine) {
    for (const part of langLine.split(/,|\band\b/)) {
      const language = part.replace(/\(.*?\)/g, "").trim();
      if (language && language.length < 30 && !/following|high intelligence|choose/i.test(language)) languages.push(language.toLowerCase());
    }
  }
  const namedFeats = [
    ...traits.matchAll(/(?:receive|select|gain)s?\s+(?:the\s+)?([A-Z][\w'() -]+?)\s+as a bonus feat/gi),
    ...traits.matchAll(/(?:receive|select|gain)s?\s+(?:the\s+)?([A-Z][\w'() -]+?)\s+feat for free/gi),
    ...traits.matchAll(/starts?\s+with\s+(?:the\s+)?([A-Z][\w'() -]+?)\s+feat/gi)
  ].map((match) => match[1].trim());
  const uniqueFeats = [...new Set(namedFeats)];
  const featLines = traits.split(/\n/).filter((line) => /bonus feat/i.test(line)).length;
  if (uniqueFeats.length || featLines) {
    changes.push({ target: "bonusFeats", formula: String(Math.max(uniqueFeats.length, featLines)), type: "untyped" });
  }
  const armor = traits.match(/\+\s*(\d+)\s+(?:racial\s+)?(?:bonus\s+to\s+(?:their\s+)?)?natural armor/i);
  if (armor) changes.push({ target: "nac", formula: armor[1] || armor[2], type: "racial" });
  const init = traits.match(/\+\s*(\d+)\s+(?:racial\s+)?bonus (?:on|to) initiative/i);
  if (init) changes.push({ target: "init", formula: init[1], type: "racial" });
  for (const [save, target] of [["Fortitude", "fort"], ["Reflex", "ref"], ["Will", "will"]]) {
    const saveBonus = traits.match(new RegExp(`\\+\\s*(\\d+)\\s+(?:racial\\s+)?bonus on (?:all\\s+)?${save} saves(?!\\s+against)`, "i"));
    if (saveBonus) changes.push({ target, formula: saveBonus[1], type: "racial" });
  }
  for (const match of traits.matchAll(/\b(fire|cold|electricity|acid|sonic)\s+resistance\s+(\d+)/gi)) {
    notes.push(`${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} resistance ${match[2]}`);
  }
  if (/low-light vision/i.test(traits)) notes.push("Low-light vision");
  const dark = traits.match(/dark\s*vision[^\d]{0,40}(\d+)\s*(?:feet|ft)/i);
  if (dark) notes.push(`Darkvision ${dark[1]} ft.`);
  if (uniqueFeats.length) notes.push(`Bonus feat: ${uniqueFeats.join(", ")}`);
  if (/can never gain morale bonuses|immune to morale/i.test(traits)) notes.push("Immune to morale bonuses");
  return {
    changes,
    notes,
    speed,
    fly: fly ? { speed: Number(fly[1]), maneuver: (fly[2] || "").toLowerCase() } : null,
    size: sizeWord ? SIZES[sizeWord] : null,
    creatureTypes,
    subtypes,
    languages,
    lowLight: /low-light vision/i.test(traits),
    darkvision: Boolean(dark),
    traits
  };
}

function changeId(seed) {
  return foundryId(seed).slice(0, 8).toLowerCase();
}

function mergeChanges(existing, desired) {
  const ability = new Set(["str", "dex", "con", "int", "wis", "cha"]);
  const abilityAlias = { wismod: "wis", strmod: "str", dexmod: "dex", conmod: "con", intmod: "int", chamod: "cha" };
  const replaceAbilities = desired.some((change) => ability.has(change.target));
  const replaceSkills = replaceAbilities;
  const desiredByTarget = new Map(desired.map((change) => [change.target, change]));
  const kept = [];
  const used = new Set();
  for (const original of existing ?? []) {
    const aliased = abilityAlias[String(original.target).toLowerCase()];
    const change = aliased && desiredByTarget.has(aliased) ? { ...original, target: aliased } : original;
    const target = change.target;
    if (ability.has(target)) {
      if (!replaceAbilities) {
        kept.push(change);
        continue;
      }
      const next = desiredByTarget.get(target);
      if (!next) continue;
      kept.push({ ...change, formula: String(next.formula), type: change.type || "racial" });
      used.add(target);
      continue;
    }
    if (String(target).startsWith("skill.")) {
      if (!replaceSkills) {
        kept.push(change);
        continue;
      }
      const next = desiredByTarget.get(target);
      if (!next) continue;
      kept.push({ ...change, formula: String(next.formula), type: "racial" });
      used.add(target);
      continue;
    }
    const next = desiredByTarget.get(target);
    if (next) {
      kept.push({ ...change, formula: String(next.formula), type: change.type || next.type || "racial" });
      used.add(target);
      continue;
    }
    kept.push(change);
  }
  for (const change of desired) {
    if (used.has(change.target)) continue;
    if (change.target === "bonusFeats" && kept.some((item) => item.target === "bonusFeats")) continue;
    kept.push({
      _id: changeId(`${change.target}|${change.formula}|${kept.length}`),
      formula: String(change.formula),
      target: change.target,
      type: change.type || "racial"
    });
  }
  const result = [];
  const seen = new Map();
  for (const change of kept) {
    if (seen.has(change.target)) {
      if (desiredByTarget.has(change.target)) {
        result[seen.get(change.target)].formula = String(desiredByTarget.get(change.target).formula);
      }
      continue;
    }
    seen.set(change.target, result.length);
    result.push(change);
  }
  return result;
}

function blankRace(name) {
  return {
    _id: foundryId(`homebrew-race|${name}`),
    effects: [],
    img: "icons/svg/mystery-man.svg",
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    type: "race",
    name,
    system: {
      description: { value: "", instructions: "" },
      tags: ["Homebrew"],
      changes: [],
      changeFlags: {
        immuneToMorale: false, loseDexToAC: false, noMediumEncumbrance: false, noHeavyEncumbrance: false,
        mediumArmorFullSpeed: false, heavyArmorFullSpeed: false, lowLightVision: false, seeInvisibility: false, seeInDarkness: false
      },
      contextNotes: [],
      links: { children: [] },
      armorProf: [],
      weaponProf: [],
      languages: [],
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      size: "med",
      speeds: { land: 30, fly: null, flyManeuverability: "", swim: null, climb: null, burrow: null },
      creatureTypes: ["humanoid"],
      creatureSubtypes: [],
      sources: []
    },
    _stats: {
      coreVersion: "13.351", systemId: "pf1", systemVersion: "11.11",
      createdTime: 1759360000000, modifiedTime: 1759360000000,
      lastModifiedBy: null, compendiumSource: null, duplicateSource: null, exportSource: null
    }
  };
}

function applyRace(doc, race, mechanics, isNew) {
  doc.system.description.value = descriptionHtml(race);
  doc.system.changes = mergeChanges(doc.system.changes, mechanics.changes);
  if (mechanics.size) doc.system.size = mechanics.size;
  if (mechanics.speed) doc.system.speeds.land = mechanics.speed;
  if (mechanics.fly) {
    doc.system.speeds.fly = mechanics.fly.speed;
    doc.system.speeds.flyManeuverability = mechanics.fly.maneuver || "average";
  }
  if (mechanics.creatureTypes.length) doc.system.creatureTypes = mechanics.creatureTypes;
  const mentionsVision = /vision|darkvision|low-light/i.test(mechanics.traits ?? "");
  if (mentionsVision) {
    doc.system.changeFlags.lowLightVision = mechanics.lowLight;
    doc.system.changeFlags.seeInDarkness = mechanics.darkvision;
  } else {
    if (mechanics.lowLight) doc.system.changeFlags.lowLightVision = true;
    if (mechanics.darkvision) doc.system.changeFlags.seeInDarkness = true;
  }
  if (mechanics.subtypes.length) doc.system.creatureSubtypes = mechanics.subtypes;
  if (mechanics.languages.length) doc.system.languages = mechanics.languages;
  if (/can never gain morale bonuses|immune to morale/i.test(doc.system.description.value)) doc.system.changeFlags.immuneToMorale = true;
  const existingNotes = new Set((doc.system.contextNotes ?? []).map((note) => note.text));
  for (const text of mechanics.notes) {
    if (existingNotes.has(text)) continue;
    doc.system.contextNotes.push({ target: "misc", text });
  }
  if (isNew) doc.system.tags = ["Homebrew"];
  else if (!doc.system.tags?.includes("Homebrew") && race.name !== doc.name) doc.system.tags = [...(doc.system.tags ?? []), "Homebrew"];
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
  await db.batch([
    ...folders.map((folder) => ({ type: "put", key: `!folders!${folder._id}`, value: JSON.stringify(folder) })),
    ...docs.map((doc) => ({ type: "put", key: `!items!${doc._id}`, value: JSON.stringify(doc) }))
  ]);
  await db.compactRange("!", "~");
  await db.close();
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
      try {
        fs.rmSync(full);
      } catch (error) {
        console.error("Could not remove", full, error.message);
      }
    }
  }
  for (const file of incoming) {
    if (file === "LOCK") continue;
    try {
      fs.copyFileSync(path.join(staged, file), path.join(output, file));
    } catch (error) {
      console.error("Could not copy", file, "to", output, error.message);
    }
  }
}

function normalizeName(name) {
  let text = name.toLowerCase();
  const replacements = [
    [/fennic/g, "fennec"],
    [/alraune/g, "alrune"],
    [/half-oni/g, "half oni"],
    [/wolfkins/g, "wolfkin"],
    [/tengus/g, "tengu"],
    [/vampires/g, "vampire"],
    [/halflings/g, "halfling"],
    [/dwarves/g, "dwarf"],
    [/orcs/g, "orc"],
    [/changelings/g, "changeling"]
  ];
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  text = text
    .replace(/\((?:base|ar|neko)\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(base|ancestry)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.split(" ").filter(Boolean);
}

function tokenKey(name) {
  return [...new Set(normalizeName(name))].sort().join("|");
}

function findSharedMatches(race, raceDocs) {
  const forced = FORCE_MATCH.get(canonical(race.name));
  if (forced) return raceDocs.filter((doc) => forced.includes(doc.name));
  const want = tokenKey(race.name);
  const exact = raceDocs.filter((doc) => tokenKey(doc.name) === want);
  if (exact.length) return exact;
  const wantTokens = new Set(normalizeName(race.name));
  return raceDocs.filter((doc) => {
    const have = new Set(normalizeName(doc.name));
    if (have.size <= wantTokens.size) return false;
    for (const token of wantTokens) if (!have.has(token)) return false;
    return true;
  });
}

function folderFor(name) {
  for (const [pattern, id] of FOLDERS_BY_HINT) {
    if (pattern.test(name)) return id;
  }
  return AZURE_RACES;
}

function splitUnits(lines) {
  const units = [];
  let current = null;
  for (const line of lines) {
    const match = line.trim().match(/^([A-Z]) \(([^)]+)\) Unit:\s*$/);
    if (match) {
      current = { letter: match[1], title: match[2], lines: [] };
      units.push(current);
    } else if (current) current.lines.push(line);
  }
  return units;
}

function changeSummary(doc) {
  return (doc.system.changes ?? []).map((change) => `${change.target} ${change.formula}`).join(", ");
}

const sharedCopy = path.join(process.env.TEMP, "azure-items-source");
copyLevelPack(SHARED_SOURCE, sharedCopy);
const races = parseDocument(fs.readFileSync(DOC, "utf8"));
const { folders, docs } = await loadPack(sharedCopy);
const raceDocs = docs.filter((doc) => doc.type === "race");
const systemCopy = path.join(process.env.TEMP, "pf1-system-races-source");
copyLevelPack(SYSTEM_OUTPUTS[0], systemCopy);
const systemPack = await loadPack(systemCopy);
const originalPack = await loadPack(ORIGINAL_SYSTEM);
const originalNames = new Set(originalPack.docs.filter((doc) => doc.type === "race").map((doc) => doc.name));
const systemKeys = new Set([...originalNames].map((name) => tokenKey(name)));

let added = 0;
let updated = 0;
let skipped = 0;
const consumed = new Set();
for (const race of races) {
  const traits = standardTraitText(race.lines);
  const mechanics = parseMechanics(traits);
  const matches = findSharedMatches(race, raceDocs.filter((doc) => !consumed.has(doc._id) || tokenKey(doc.name) === tokenKey(race.name)));
  const exact = matches.filter((doc) => tokenKey(doc.name) === tokenKey(race.name) || FORCE_MATCH.get(canonical(race.name))?.includes(doc.name));
  const chosen = exact.length ? exact : matches;
  if (chosen.length > 1 && !exact.length) {
    console.log(`AMBIGUOUS ${race.name} -> ${chosen.map((doc) => doc.name).join(" | ")}`);
    skipped += 1;
    continue;
  }
  if (chosen.length) {
    for (const existing of chosen) {
      applyRace(existing, race, mechanics, false);
      consumed.add(existing._id);
      updated += 1;
      console.log(`UPDATE ${existing.name} <- ${race.name} | ${changeSummary(existing)}`);
    }
    continue;
  }
  if (systemKeys.has(tokenKey(race.name))) {
    skipped += 1;
    console.log(`SYSTEM ${race.name} (already in the Pathfinder race pack)`);
    continue;
  }
  const doc = blankRace(race.name.replace(/^Dwarf Subtype -\s*/i, ""));
  doc.folder = folderFor(race.name);
  const sibling = raceDocs.find((item) => item.folder === doc.folder && item.img && !item.img.includes("mystery-man"));
  if (sibling) doc.img = sibling.img;
  applyRace(doc, race, mechanics, true);
  docs.push(doc);
  raceDocs.push(doc);
  added += 1;
  console.log(`ADD    ${doc.name} | ${changeSummary(doc) || "(no numeric changes)"}`);
}

const anvac = races.find((race) => canonical(race.name) === "anvac android");
if (anvac) {
  for (const unit of splitUnits(anvac.lines)) {
    const existing = raceDocs.find((doc) => doc.name === `AnVAc-${unit.letter}`);
    if (!existing) continue;
    const mechanics = parseMechanics(standardTraitText(unit.lines));
    applyRace(existing, { name: existing.name, lines: unit.lines }, mechanics, false);
    updated += 1;
    console.log(`UNIT   ${existing.name} <- ${unit.letter} (${unit.title}) | ${changeSummary(existing)}`);
  }
}

console.log(`document races ${races.length}; updated ${updated}; added ${added}; left on system or ambiguous ${skipped}`);

const removed = [];
systemPack.docs = systemPack.docs.filter((doc) => {
  if (doc.type !== "race" || originalNames.has(doc.name)) return true;
  removed.push(doc.name);
  return false;
});
console.log(`system pack duplicates to remove ${removed.length}`);
for (const name of removed.sort()) console.log(`REMOVE ${name}`);

if (DRY) process.exit(0);

const sharedStaged = path.join(process.env.TEMP, "azure-items-updated");
await writePack(sharedStaged, folders, docs);
for (const output of SHARED_OUTPUTS) {
  publishPack(sharedStaged, output);
  console.log("Updated", output);
}
const systemStaged = path.join(process.env.TEMP, "pf1-races-deduped");
await writePack(systemStaged, systemPack.folders, systemPack.docs);
for (const output of SYSTEM_OUTPUTS) {
  publishPack(systemStaged, output);
  console.log("Updated", output);
}
