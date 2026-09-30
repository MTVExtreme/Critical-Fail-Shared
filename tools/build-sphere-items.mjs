/**
 * Builds the Spheres Items compendium from the Spheres of Power Wiki
 * equipment catalogs (Open Game Content, OGL 1.0a).
 *
 *   node tools/build-sphere-items.mjs
 *   node tools/build-sphere-items.mjs --dry
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
const PACK_DIR = path.join(MODULE_ROOT, "packs", "spheres-items");
const CACHE_DIR = path.join(process.env.TEMP || "/tmp", "wiki-items");
const DRY = process.argv.includes("--dry");

const PAGES = [
  { slug: "marvelous-items", folder: "Marvelous Items", system: "Power" },
  { slug: "marvelous-items-2", folder: "Marvelous Items", system: "Power" },
  { slug: "implements", folder: "Implements", system: "Power" },
  { slug: "spell-engines", folder: "Spell Engines", system: "Power" },
  { slug: "compounds", folder: "Compounds", system: "Power" },
  { slug: "charms", folder: "Charms", system: "Power" },
  { slug: "apparatuses", folder: "Apparatuses", system: "Power" },
  { slug: "scrolls", folder: "Scrolls", system: "Power" },
  { slug: "talent-crystals", folder: "Talent Crystals", system: "Power" },
  { slug: "spellzones", folder: "Spellzones", system: "Power" },
  { slug: "schematics", folder: "Schematics", system: "Power" },
  { slug: "alchemical-items", folder: "Alchemical Items", system: "Power" },
  { slug: "fabled-items", folder: "Fabled Items", system: "Power" },
  { slug: "weapons", folder: "Weapons", system: "Might" },
  { slug: "armor", folder: "Armor and Shields", system: "Might" },
  { slug: "equipment", folder: "Adventuring Equipment", system: "Might" },
  { slug: "special-materials", folder: "Special Materials", system: "Might" }
];

const SLOT_MAP = [
  [/\bheadbands?\b/, "headband"],
  [/\bwrists?\b/, "wrists"],
  [/\bshoulders?\b/, "shoulders"],
  [/\bbelts?\b/, "belt"],
  [/\bneck\b/, "neck"],
  [/\brings?\b/, "ring"],
  [/\bfeet\b|\bboots?\b/, "feet"],
  [/\bhands?\b|\bgloves?\b/, "hands"],
  [/\beyes?\b|\bgoggles?\b/, "eyes"],
  [/\bchest\b/, "chest"],
  [/\bbody\b/, "body"],
  [/\bhead\b|\bhelms?\b/, "head"],
  [/\bshields?\b/, "shield"],
  [/\barmou?r\b/, "armor"],
  [/\bnone\b|\bslotless\b/, "slotless"]
];

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

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'");
}

function htmlToText(html) {
  return decodeEntities(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function sliceBalancedDiv(html, openTagIndex) {
  const openEnd = html.indexOf(">", openTagIndex);
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = openEnd + 1;
  let depth = 1;
  let match;
  while ((match = re.exec(html))) {
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(openEnd + 1, match.index);
  }
  return html.slice(openEnd + 1);
}

function extractDivById(html, id) {
  const match = new RegExp(`<div\\s+id="${id}"[^>]*>`, "i").exec(html);
  if (!match) return null;
  return sliceBalancedDiv(html, match.index);
}

function cleanFragment(html) {
  let out = html;
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<span\b[^>]*line-through[^>]*>([\s\S]*?)<\/span>/gi, "<s>$1</s>");
  out = out.replace(/<\/?span\b[^>]*>/gi, "");
  out = out.replace(/<a\b[^>]*href="javascript:[^"]*"[^>]*>/gi, "");
  out = out.replace(/<a\b([^>]*?)href="\/([^"]+)"([^>]*)>/gi, (_m, pre, href, post) => {
    return `<a${pre}href="https://spheresofpower.wikidot.com/${href}"${post}>`;
  });
  out = out.replace(/<h1\b/gi, "<h3").replace(/<\/h1>/gi, "</h3>");
  out = out.replace(/<h2\b/gi, "<h3").replace(/<\/h2>/gi, "</h3>");
  out = out.replace(/<hr\s*\/?>/gi, "");
  return out.trim();
}

function parseTitle(raw) {
  let name = raw.replace(/\s+/g, " ").trim();
  const tags = [];
  name = name.replace(/\[([^\]]+)\]/g, (_, inner) => {
    for (const part of inner.split(",")) {
      const tag = part.trim();
      if (tag) tags.push(tag);
    }
    return " ";
  });
  name = name.replace(/\s+/g, " ").trim();
  return { name, tags };
}

function isRulesHeading(title) {
  return /^(note\b|faq\b|creating|step-by-step|using magic|cost modifier|staying with|focuses$|effects$|negation$|passive effect|continual |triggered effect|multiple uses|item placement|can i |talent crystals in your world|item base|adjusting wealth|spell trigger|wiki note|table:|effect restriction|spellzone weakness|spellzone size|limited duration|physical touchstone|corruptible$|modifying an extant|suppressing or destroying|moving a spellzone)/i.test(title);
}

function isCatalogSection(title) {
  return /sample|new |weapon|armor|shield|gear|compound|charm|apparatus|implement|scroll|crystal|spellzone|schematic|alchemical|material|artifact|mythic|wiki|slot|pack|potion|ammunition|building|vehicle|herb|recreational|deck|shard|enhancement|propert|abilit|transformation|catnip|proxy/i.test(title);
}

function looksLikeItem(title, body, section) {
  if (isRulesHeading(title)) return false;
  const text = htmlToText(body);
  if (/price\s+[\d,]+|aura\s+\w+|construction requirements|cost\s+[\d,]+ gp/i.test(text)) return true;
  return Boolean(section && isCatalogSection(section) && text.length > 80);
}

function slotFromLabel(label) {
  const source = String(label || "").toLowerCase();
  for (const [pattern, slot] of SLOT_MAP) {
    if (pattern.test(source)) return slot;
  }
  return null;
}

function parseStats(text, section) {
  const price = text.match(/Price\s+([\d,]+)\s*gp/i);
  const weight = text.match(/Weight\s+([\d.]+)\s*lb/i);
  const cl = text.match(/\bCL\s+(\d+)/i);
  const slotField = text.match(/Slot\s+([^;.<]+)/i)?.[1] || "";
  return {
    price: price ? Number(price[1].replace(/,/g, "")) : 0,
    weight: weight ? Number(weight[1]) : 0,
    cl: cl ? Number(cl[1]) : 0,
    slot: slotFromLabel(slotField) || slotFromLabel(section) || "slotless"
  };
}

function itemIcon(slot, page) {
  if (page.slug === "weapons") return "icons/weapons/swords/sword-guard-steel.webp";
  if (page.slug === "armor") return "icons/equipment/chest/breastplate-layered-steel.webp";
  if (page.slug === "special-materials") return "icons/commodities/metal/ingot-steel.webp";
  const icons = {
    ring: "icons/equipment/finger/ring-shield-silver.webp",
    belt: "icons/equipment/waist/belt-buckle-square-steel.webp",
    neck: "icons/equipment/neck/amulet-round-gold-blue.webp",
    head: "icons/equipment/head/helm-barbute-steel.webp",
    headband: "icons/equipment/head/hood-cloth-grey.webp",
    hands: "icons/equipment/hand/glove-simple-leather.webp",
    feet: "icons/equipment/feet/boots-leather-brown.webp",
    eyes: "icons/tools/senses/spyglass-brown.webp",
    shoulders: "icons/equipment/back/cloak-brown.webp",
    chest: "icons/equipment/chest/breastplate-scale-grey.webp",
    body: "icons/equipment/chest/breastplate-scale-grey.webp",
    wrists: "icons/equipment/wrist/bracer-studded-leather.webp",
    shield: "icons/equipment/shield/heater-steel-boss.webp",
    armor: "icons/equipment/chest/breastplate-layered-steel.webp",
    slotless: "icons/commodities/treasure/brooch-jewel-gold.webp"
  };
  return icons[slot] || icons.slotless;
}

function blankEquipment(icon) {
  return {
    effects: [],
    img: icon,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: { pf1: {}, "critical-fail-shared": {} },
    type: "equipment",
    system: {
      description: { value: "", instructions: "", unidentified: "" },
      tags: [],
      quantity: 1,
      weight: { value: 0 },
      equipped: false,
      carried: true,
      price: 0,
      size: "med",
      resizing: false,
      timeworn: false,
      artifact: false,
      identified: true,
      unidentified: { price: 0, name: "" },
      cursed: false,
      cl: 0,
      aura: { custom: false, school: "" },
      hp: { base: 10 },
      broken: false,
      hardness: 0,
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
      actions: [],
      attackNotes: [],
      effectNotes: [],
      uses: { value: null, per: "", autoDeductChargesCost: "", maxFormula: "", rechargeFormula: "" },
      links: { children: [], charges: [] },
      tag: "",
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      masterwork: false,
      enh: null,
      proficient: true,
      held: "1h",
      ammo: { type: "", capacity: null, misfire: null, explode: null },
      subType: "wondrous",
      slot: "slotless",
      equipmentSubtype: "lightArmor",
      hands: 0,
      baseTypes: [],
      armor: {
        value: 0,
        dex: null,
        acp: 0,
        enh: 0,
        material: {
          base: { value: "", custom: false },
          normal: { value: "", custom: false },
          addon: []
        }
      },
      spellFailure: 0,
      showInQuickbar: false
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

function parsePage(html) {
  let content = extractDivById(html, "wiki-tab-0-0") || extractDivById(html, "page-content") || "";
  const nose = content.match(/<div\s+class="noselect"/i);
  if (nose) {
    const block = sliceBalancedDiv(content, nose.index);
    const end = content.indexOf(">", nose.index) + 1 + block.length;
    content = content.slice(0, nose.index) + content.slice(content.indexOf("</div>", end) + 6);
  }
  const headings = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(content))) {
    headings.push({
      level: Number(match[1]),
      title: htmlToText(match[2]),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return headings.map((heading, index) => {
    const next = headings[index + 1];
    return {
      ...heading,
      body: cleanFragment(content.slice(heading.end, next ? next.start : content.length))
    };
  });
}

async function main() {
  const folders = new Map();
  const documents = [];
  const usedNames = new Set();
  const counts = {};

  const ensureFolder = (page, section) => {
    const color = page.system === "Might" ? "#993300" : "#1a4f8b";
    const catalogId = foundryId(`critical-fail-shared|item-folder|${page.folder}`);
    if (!folders.has(catalogId)) {
      folders.set(catalogId, folderDoc(catalogId, page.folder, null, folders.size * 100000, color));
    }
    if (!section) return catalogId;
    const sectionId = foundryId(`critical-fail-shared|item-folder|${page.folder}|${section}`);
    if (!folders.has(sectionId)) {
      folders.set(sectionId, folderDoc(sectionId, section, catalogId, 0, color));
    }
    return sectionId;
  };

  for (const page of PAGES) {
    const file = path.join(CACHE_DIR, `${page.slug}.html`);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    const headings = parsePage(fs.readFileSync(file, "utf8"));
    let section = page.folder;
    let pageCount = 0;
    for (const heading of headings) {
      if (heading.level <= 2) {
        if (!isRulesHeading(heading.title)) section = heading.title;
        continue;
      }
      if (!looksLikeItem(heading.title, heading.body, section)) continue;
      const parsed = parseTitle(heading.title);
      if (!parsed.name || parsed.name.length < 2) continue;
      const text = htmlToText(heading.body);
      const stats = parseStats(`${heading.title} ${text}`, section);
      let name = parsed.name;
      let unique = name;
      let duplicate = 2;
      while (usedNames.has(unique.toLowerCase())) {
        unique = `${parsed.name} (${page.folder}${duplicate > 2 ? ` ${duplicate}` : ""})`;
        duplicate += 1;
      }
      usedNames.add(unique.toLowerCase());
      name = unique;
      const doc = blankEquipment(itemIcon(stats.slot, page));
      doc._id = foundryId(`critical-fail-shared|item|${page.slug}|${heading.title}`);
      doc.name = name;
      doc.folder = ensureFolder(page, section === page.folder ? null : section);
      doc.sort = pageCount * 1000;
      doc.system.price = stats.price;
      doc.system.weight.value = stats.weight;
      doc.system.cl = stats.cl;
      doc.system.slot = stats.slot;
      doc.system.tags = [page.system, page.folder, section, ...parsed.tags].filter((tag, index, all) => tag && all.indexOf(tag) === index);
      if (/artifact/i.test(section) || /artifact/i.test(heading.title)) doc.system.artifact = true;
      const url = `https://spheresofpower.wikidot.com/${page.slug}`;
      doc.system.description.value = [
        `<p><em>Open Game Content. <a href="${url}">${escapeHtml(page.folder)}</a> (OGL 1.0a).</em></p>`,
        `<p><strong>${escapeHtml(heading.title)}</strong></p>`,
        heading.body
      ].join("\n");
      doc.flags["critical-fail-shared"] = { wiki: url, catalog: page.slug, section };
      documents.push(doc);
      pageCount += 1;
    }
    counts[page.folder] = (counts[page.folder] || 0) + pageCount;
    console.log(`${page.slug}: ${pageCount}`);
  }

  console.log(`Items ${documents.length} folders ${folders.size}`, JSON.stringify(counts));
  if (DRY) {
    const suspect = documents.filter((entry) => /effects|negation|passive|triggered|multiple uses|staying|focuses|faq|note:|creating|cost modifier|using magic/i.test(entry.name));
    console.log("suspect", suspect.map((entry) => entry.name).join(" | ") || "none");
    for (const catalog of ["Spellzones", "Fabled Items", "Schematics", "Adventuring Equipment"]) {
      console.log(catalog, documents.filter((entry) => entry.system.tags.includes(catalog)).map((entry) => entry.name).join("; "));
    }
    return;
  }

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
