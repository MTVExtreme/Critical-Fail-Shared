/**
 * Builds the Spheres Feats compendium from the Spheres Wiki content
 * (Open Game Content, OGL 1.0a), including Power, Might, Guile, and
 * Dual Sphere (admixture) feats.
 *
 *   node tools/build-sphere-feats.mjs
 *   node tools/build-sphere-feats.mjs --dry
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire("F:/Code/Foundry Code/package.json");
const { ClassicLevel } = require("classic-level");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(__dirname, "..");
const PACK_DIR = path.join(MODULE_ROOT, "packs", "spheres-feats");
const CONTENT_ROOT = path.join(process.env.TEMP || "/tmp", "spheres-wiki", "src", "content");
const ICON_DIR = path.join(MODULE_ROOT, "img", "spheres");
const DRY = process.argv.includes("--dry");
const WIKI = "https://taylorturnerit.github.io/spheres-wiki";

const SYSTEMS = new Set(["power", "might", "guile", "champions"]);
const SYSTEM_META = {
  power: { label: "Spheres of Power", color: "#1a4f8b", sort: 0 },
  might: { label: "Spheres of Might", color: "#993300", sort: 1 },
  guile: { label: "Spheres of Guile", color: "#4b0092", sort: 2 },
  champions: { label: "Champions of the Spheres", color: "#1b7a3a", sort: 3 },
  other: { label: "Other Spheres Feats", color: "#666666", sort: 4 }
};

const CATEGORY_LABELS = {
  admixture: "Dual Sphere",
  "item-creation": "Item Creation",
  "wild-magic": "Wild Magic",
  "fallen-fey": "Fallen Fey",
  practitioner: "Practitioner",
  operative: "Operative",
  champion: "Champion",
  counterspell: "Counterspell",
  metamagic: "Metamagic",
  general: "General",
  combat: "Combat",
  drawback: "Drawback",
  extra: "Extra",
  racial: "Racial",
  teamwork: "Teamwork",
  squadron: "Squadron",
  companion: "Companion",
  channeling: "Channeling",
  protokinesis: "Protokinesis",
  proxy: "Proxy",
  ritual: "Ritual",
  anathema: "Anathema",
  necrosis: "Necrosis",
  chance: "Chance",
  deck: "Deck",
  mythic: "Mythic",
  surreal: "Surreal",
  ante: "Ante",
  saga: "Saga",
  "dual-wielding": "Dual Wielding",
  "open-hand": "Open Hand"
};

const iconFiles = new Set(fs.existsSync(ICON_DIR) ? fs.readdirSync(ICON_DIR) : []);

function foundryId(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += alphabet[hash[i] % alphabet.length];
  return id;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function titleFromSlug(slug) {
  return String(slug || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the")
    .replace(/\bAnd\b/g, "and")
    .replace(/^./, (char) => char.toUpperCase());
}

function categoryLabel(category) {
  return CATEGORY_LABELS[category] || titleFromSlug(category);
}

function sphereIcon(...names) {
  for (const name of names) {
    if (!name) continue;
    const dashed = `${String(name).replace(/_/g, "-")}.webp`;
    const underscored = `${String(name).replace(/-/g, "_")}.webp`;
    if (iconFiles.has(dashed)) return `modules/critical-fail-shared/img/spheres/${dashed}`;
    if (iconFiles.has(underscored)) return `modules/critical-fail-shared/img/spheres/${underscored}`;
  }
  return "systems/pf1/icons/feats/alertness.jpg";
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { data: {}, body: text };
  const endMatch = /\r?\n---/.exec(text.slice(3));
  if (!endMatch) return { data: {}, body: text };
  const end = endMatch.index + 3;
  const raw = text.slice(3, end).replace(/^\r?\n/, "");
  const body = text.slice(end + endMatch[0].length).replace(/^\r?\n/, "");
  const data = {};
  let key = null;
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/\r/g, "");
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key && Array.isArray(data[key])) {
      data[key].push(item[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!pair) continue;
    key = pair[1];
    const value = pair[2].trim();
    if (!value || value === "|" || value === ">") data[key] = [];
    else data[key] = value.replace(/^["']|["']$/g, "").replace(/\\"/g, "\"");
  }
  return { data, body };
}

function inlineMarkdown(text) {
  const links = [];
  const withLinks = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    let url = href.trim();
    if (url.startsWith("/")) url = `${WIKI}${url}`;
    else if (!/^https?:/i.test(url)) url = `${WIKI}/${url.replace(/^\.\//, "")}`;
    links.push(`<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`);
    return `\u0000${links.length - 1}\u0000`;
  });
  let html = escapeHtml(withLinks);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/\u0000(\d+)\u0000/g, (_, index) => links[Number(index)]);
  return html;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 4);
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return blocks.join("\n");
}

function walkFeats(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFeats(full, found);
    else if (entry.isFile() && entry.name.endsWith(".md") && full.includes(`${path.sep}feats${path.sep}`)) found.push(full);
  }
  return found;
}

function classify(file) {
  const rel = path.relative(CONTENT_ROOT, file);
  const parts = rel.split(path.sep);
  const featsAt = parts.indexOf("feats");
  const system = parts.slice(0, featsAt).reverse().find((part) => SYSTEMS.has(part)) || "other";
  const after = parts.slice(featsAt + 1);
  const id = after.at(-1).replace(/\.md$/, "");
  const category = after.length >= 2 ? after.at(-2) : "general";
  const spheresAt = parts.indexOf("spheres");
  const sphere = spheresAt >= 0 && spheresAt < featsAt ? parts[spheresAt + 1] : null;
  return { book: parts[0], system, category, id, sphere, rel };
}

function blankFeat(icon) {
  return {
    effects: [],
    img: icon,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: { pf1: {}, "critical-fail-shared": {} },
    type: "feat",
    system: {
      description: { value: "", instructions: "", unidentified: "" },
      tags: [],
      actions: [],
      attackNotes: [],
      effectNotes: [],
      uses: { value: 0, per: null, autoDeductChargesCost: "1", maxFormula: "", rechargeFormula: "" },
      changes: [],
      changeFlags: {
        immuneToMorale: false,
        loseDexToAC: false,
        noMediumEncumbrance: false,
        noHeavyEncumbrance: false,
        mediumArmorFullSpeed: false,
        heavyArmorFullSpeed: false,
        lowLightVision: false,
        seeInvisibility: false,
        seeInDarkness: false
      },
      contextNotes: [],
      links: { children: [], charges: [] },
      tag: "",
      armorProf: [],
      weaponProf: [],
      languages: [],
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      subType: "feat",
      traitType: "",
      traitCategory: "",
      racePoints: null,
      abilityType: "na",
      associations: { classes: [] },
      showInQuickbar: false,
      crOffset: "",
      inherited: false,
      acquired: false,
      simple: false,
      summons: false,
      disabled: false,
      classSkills: {},
      ability: { attack: null, critMult: 2, critRange: 20, damage: null, damageMult: 1 },
      attackBonus: "",
      attackName: "",
      attackParts: [],
      critConfirmBonus: "",
      damage: { critParts: [], nonCritParts: [], parts: [] },
      duration: { units: "", value: null },
      formula: "",
      formulaicAttacks: { bonus: { formula: "" }, count: { formula: "" }, label: null },
      nonlethal: false,
      powerAttack: { critMultiplier: 1, damageBonus: 2, multiplier: "" },
      save: { dc: 0, description: "", type: "" },
      soundEffect: "",
      target: { value: "" }
    },
    _stats: {
      coreVersion: "13.351",
      systemId: "pf1",
      systemVersion: "11.11",
      createdTime: 1759180800000,
      modifiedTime: 1759180800000,
      lastModifiedBy: null,
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null
    }
  };
}

function folderDoc(id, name, parent, sort, color) {
  return {
    _id: id,
    name,
    type: "Item",
    description: "",
    folder: parent,
    sorting: "a",
    sort,
    color,
    flags: {},
    _stats: {
      coreVersion: "13.351",
      systemId: "pf1",
      systemVersion: "11.11",
      createdTime: 1759180800000,
      modifiedTime: 1759180800000,
      lastModifiedBy: null
    }
  };
}

const SPHERE_KEYS = {
  "body-control": "bodyControl",
  "fallen-fey": "fallenFey",
  fallen_fey: "fallenFey",
  "dual-wielding": "dualWielding",
  dual_wielding: "dualWielding",
  "open-hand": "openHand",
  open_hand: "openHand"
};

function sphereKey(value) {
  if (!value) return null;
  return SPHERE_KEYS[value] || value;
}

function abilityType(body) {
  if (/\(Su\)/.test(body)) return "su";
  if (/\(Sp\)/.test(body)) return "sp";
  if (/\(Ex\)/.test(body)) return "ex";
  return "na";
}

async function main() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Missing wiki checkout at ${CONTENT_ROOT}. Clone https://github.com/TaylorTurnerIT/spheres-wiki there first.`);
  }
  const files = walkFeats(CONTENT_ROOT);
  const folders = new Map();
  const documents = [];
  const usedNames = new Map();

  const ensureFolder = (system, category) => {
    const meta = SYSTEM_META[system] || SYSTEM_META.other;
    const systemId = foundryId(`critical-fail-shared|feat-folder|${system}`);
    if (!folders.has(systemId)) {
      folders.set(systemId, folderDoc(systemId, meta.label, null, meta.sort * 100000, meta.color));
    }
    const label = categoryLabel(category);
    const categoryId = foundryId(`critical-fail-shared|feat-folder|${system}|${category}`);
    if (!folders.has(categoryId)) {
      folders.set(categoryId, folderDoc(categoryId, label, systemId, 0, meta.color));
    }
    return categoryId;
  };

  for (const file of files) {
    const info = classify(file);
    const text = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(text);
    const name = data.name || titleFromSlug(info.id);
    const book = titleFromSlug(info.book);
    const category = data.category || info.category;
    const tags = [
      categoryLabel(category),
      SYSTEM_META[info.system]?.label || info.system,
      ...(Array.isArray(data.tags) ? data.tags.map(titleFromSlug) : [])
    ];
    if (info.sphere) tags.push(titleFromSlug(info.sphere));
    if (book) tags.push(book);
    const uniqueTags = [...new Set(tags.filter(Boolean))];
    const nameKey = `${info.system}:${name.toLowerCase()}`;
    let displayName = name;
    if (usedNames.has(nameKey)) displayName = `${name} (${book})`;
    usedNames.set(nameKey, true);
    const doc = blankFeat(sphereIcon(data.sphere, info.sphere, category));
    doc._id = foundryId(`critical-fail-shared|feat|${info.rel}`);
    doc.name = displayName;
    doc.folder = ensureFolder(info.system, category);
    doc.system.tags = uniqueTags;
    doc.system.abilityType = abilityType(body);
    const sphere = sphereKey(data.sphere || info.sphere);
    const url = `${WIKI}/${info.system}/feats/${category}/${info.id}`;
    const summary = data.summary ? `<p><em>${inlineMarkdown(data.summary)}</em></p>` : "";
    doc.system.description.value = [
      `<p><em>Open Game Content. <a href="${url}">${escapeHtml(displayName)}</a> (${escapeHtml(book)}, OGL 1.0a).</em></p>`,
      summary,
      markdownToHtml(body)
    ].filter(Boolean).join("\n");
    doc.flags["critical-fail-shared"] = {
      wiki: url,
      system: info.system,
      category,
      book: info.book,
      sphere
    };
    if (sphere) doc.flags.pf1spheres = { sphere };
    documents.push(doc);
  }

  const counts = {};
  for (const doc of documents) {
    const system = doc.flags["critical-fail-shared"].system;
    counts[system] = (counts[system] || 0) + 1;
  }
  console.log(`Feats ${documents.length} folders ${folders.size}`, JSON.stringify(counts));
  const dual = documents.filter((doc) => doc.system.tags.includes("Dual Sphere")).length;
  console.log(`Dual Sphere feats ${dual}`);

  if (DRY) return;
  fs.rmSync(PACK_DIR, { recursive: true, force: true });
  fs.mkdirSync(PACK_DIR, { recursive: true });
  const db = new ClassicLevel(PACK_DIR, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  const ops = [
    ...[...folders.values()].map((folder) => ({ type: "put", key: `!folders!${folder._id}`, value: JSON.stringify(folder) })),
    ...documents.map((doc) => ({ type: "put", key: `!items!${doc._id}`, value: JSON.stringify(doc) }))
  ];
  await db.batch(ops);
  await db.compactRange("!", "~");
  await db.close();
  console.log(`Wrote ${ops.length} records to ${PACK_DIR}`);
}

await main();
