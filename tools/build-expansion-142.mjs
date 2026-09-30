/**
 * Critical Fail Shared 1.4.2
 * Tech, Tinker, and Occultism sphere talents, plus the requested classes and their features.
 *
 *   node tools/build-expansion-142.mjs --dry
 *   node tools/build-expansion-142.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire("F:/Code/Foundry Code/package.json");
const { ClassicLevel } = require("classic-level");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(process.env.TEMP || "/tmp", "sphere-expansion-html");
const DRY = process.argv.includes("--dry");
const PACK_ID = "critical-fail-shared";

const TALENT_PACK = path.join(ROOT, "packs", "expanded-sphere-talents");
const CLASS_PACK = path.join(ROOT, "packs", "spheres-classes");

const SPHERES = [
  {
    key: "tech",
    label: "Tech",
    slug: "tech",
    kind: "combat",
    icon: "modules/critical-fail-shared/img/spheres/tech.webp",
  },
  {
    key: "tinker",
    label: "Tinker",
    slug: "tinker",
    kind: "combat",
    icon: "modules/critical-fail-shared/img/spheres/tinker.png",
    appendSlugs: ["using-tinker-sphere", "mastering-gizmos"],
  },
  {
    key: "occultism",
    label: "Occultism",
    slug: "occultism",
    kind: "skill",
    icon: "modules/critical-fail-shared/img/spheres/occultism.jpg",
  },
];

const CLASSES = [
  ["Champions", false, [
    ["Dragoon", "dragoon-class"],
    ["Mountebank", "mountebank"],
    ["Necros", "necros"],
    ["Raveler", "raveler", ["raveler-class", "the-raveler", "sm-raveler", "raveler-champion"]],
    ["Reaper", "reaper"],
  ]],
  ["Operatives", false, [
    ["Advisor", "advisor"],
    ["Conduit", "conduit"],
    ["Agent", "agent"],
    ["Courser", "courser"],
    ["Envoy", "envoy"],
    ["Genius", "genius"],
    ["Mastermind", "mastermind"],
    ["Professional", "professional"],
  ]],
  ["Practitioners", false, [
    ["Technician", "technician"],
  ]],
  ["Prestige Classes", true, [
    ["Aeronaut Captain", "aeronaut-captain"],
    ["Archwizard", "archwizard"],
    ["Ascendant Vanguard", "ascendant-vanguard"],
    ["Bokor", "bokor"],
    ["Cyborg", "cyborg"],
    ["Forest Lord", "forest-lord"],
    ["Hive", "hive"],
    ["Kingking", "kingking"],
    ["Magemage", "magemage"],
    ["Realmwalker", "realmwalker"],
    ["Renowned Warrior", "renowned-warrior"],
    ["Superintelligence", "superintelligence"],
    ["Tempestarii", "tempestarii"],
    ["Waking Sleeper", "waking-sleeper"],
    ["Alternate Justicar", "alternate-justicar"],
    ["Great Mind", "great-mind"],
    ["Master of Vagueries", "master-of-vagueries"],
    ["Trinity Angel", "trinity-angel"],
  ]],
];

const SKILL_KEYS = {
  acrobatics: "acr", appraise: "apr", artistry: "art", bluff: "blf", climb: "clm", cook: "ckg",
  craft: "crf", diplomacy: "dip", "disable device": "dev", disguise: "dis", "escape artist": "esc",
  fly: "fly", "handle animal": "han", heal: "hea", intimidate: "int", linguistics: "lin", lore: "lor",
  perception: "per", perform: "prf", profession: "pro", ride: "rid", "sense motive": "sen",
  "sleight of hand": "slt", spellcraft: "spl", stealth: "ste", survival: "sur", swim: "swm",
  "use magic device": "umd",
};
const KNOWLEDGE = {
  arcana: "kar", dungeoneering: "kdu", engineering: "ken", geography: "kge", history: "khi",
  local: "klo", martial: "kmt", nature: "kna", nobility: "kno", planes: "kpl", religion: "kre",
};
const ALL_SKILL_IDS = [...new Set([...Object.values(SKILL_KEYS), ...Object.values(KNOWLEDGE), "ahp"])];

const SOURCE = "Open Game Content compiled from the Spheres of Power Wiki (OGL 1.0a).";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function foundryId(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += alphabet[hash[i] % alphabet.length];
  return id;
}

function decode(value) {
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

function textOf(html) {
  return decode(String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sliceBalanced(html, openAt, tag = "div") {
  const openEnd = html.indexOf(">", openAt);
  const re = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
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

function extractDiv(html, id) {
  const match = new RegExp(`<div\\s+id="${id}"[^>]*>`, "i").exec(html);
  return match ? sliceBalanced(html, match.index) : null;
}

function removeClassDiv(html, className) {
  const match = new RegExp(`<div\\s+class="${className}"[^>]*>`, "i").exec(html);
  if (!match) return html;
  const inner = sliceBalanced(html, match.index);
  const end = html.indexOf(">", match.index) + 1 + inner.length;
  const close = html.indexOf("</div>", end);
  return html.slice(0, match.index) + html.slice(close >= 0 ? close + 6 : end);
}

function cleanFragment(html) {
  let out = String(html ?? "");
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<span\b[^>]*line-through[^>]*>([\s\S]*?)<\/span>/gi, "<s>$1</s>");
  out = out.replace(/<\/?span\b[^>]*>/gi, "");
  out = out.replace(/<a\b[^>]*href="javascript:[^"]*"[^>]*>/gi, "");
  out = out.replace(/<a\b([^>]*?)href="\/([^"]+)"([^>]*)>/gi, (_m, pre, href, post) => `<a${pre}href="https://spheresofpower.wikidot.com/${href}"${post}>`);
  out = out.replace(/<h1\b/gi, "<h3").replace(/<\/h1>/gi, "</h3>");
  out = out.replace(/<h2\b/gi, "<h3").replace(/<\/h2>/gi, "</h3>");
  out = out.replace(/<table\b([^>]*)>/gi, (_m, attrs) => `<table${attrs.replace(/\sstyle="[^"]*"/gi, "")} style="width:100%;border-collapse:collapse" border="1">`);
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function loadHtml(slug) {
  fs.mkdirSync(CACHE, { recursive: true });
  const dest = path.join(CACHE, `${slug}.html`);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 4000) {
    const response = await fetch(`https://spheresofpower.wikidot.com/${slug}`, { redirect: "follow" });
    fs.writeFileSync(dest, await response.text());
    await sleep(180);
  }
  return fs.readFileSync(dest, "utf8");
}

function pageTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? decode(match[1]).replace(/\s+-\s+Spheres of Power Wiki\s*$/i, "").trim() : "";
}

function tabContent(html) {
  let content = extractDiv(html, "wiki-tab-0-0");
  if (!content) {
    const start = html.indexOf('<div id="page-content">');
    const end = html.indexOf('id="page-info-break"');
    content = start >= 0 ? html.slice(start, end > start ? end : undefined) : html;
  }
  return removeClassDiv(content, "noselect");
}

function headingsOf(content) {
  const headings = [];
  const re = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(content))) {
    headings.push({
      level: Number(match[1]),
      title: textOf(match[3]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  for (let i = 0; i < headings.length; i += 1) {
    const next = headings[i + 1];
    headings[i].body = cleanFragment(content.slice(headings[i].end, next ? next.start : content.length).replace(/<hr\s*\/?>/gi, ""));
  }
  return headings;
}

function isSkipTitle(title) {
  const t = title.toLowerCase();
  return /archetype|favored class|class limitation|ex-kingking|the goddess of paladins|^new feats?$|\bfeats$|starfinder|running the tech sphere/.test(t);
}

function isTalentSection(title) {
  const t = title.toLowerCase();
  return /talents$/.test(t) || /drawbacks?$/.test(t) || /packages?$/.test(t) || /talent types$/.test(t);
}

function sectionKind(title) {
  const t = title.toLowerCase();
  if (/drawbacks?$/.test(t)) return "drawback-section";
  if (/packages?$/.test(t) || /talent types$/.test(t)) return "rules-section";
  return "talent-section";
}

function classifyTalent(title, parentKind) {
  if (parentKind === "skip" || isSkipTitle(title)) return "skip";
  if (/^(table|sidebar)\b/i.test(title)) return parentKind === "entry" || parentKind === "drawback" ? "entry-child" : "base-child";
  if (parentKind === "rules" || parentKind === "rules-section") return "rules";
  if (parentKind === "entry" || parentKind === "entry-child") return "entry-child";
  if (parentKind === "drawback" || parentKind === "drawback-child") return "drawback-child";
  if (parentKind === "talent-section") return "entry";
  if (parentKind === "drawback-section") return "drawback";
  if (parentKind === "base" || parentKind === "base-child") return isTalentSection(title) ? sectionKind(title) : "base-child";
  if (isTalentSection(title)) return sectionKind(title);
  // Tech's extra catalogs (drones, procedures, options) become their own talent groups.
  if (/^(tech sphere drones|technological options|expanded crafting rules|technological procedures|artificial intelligence|item base creation)$/i.test(title)) return "talent-section";
  return "base";
}

function prettyTag(raw) {
  const tag = raw.replace(/\s+/g, " ").trim();
  if (!tag) return null;
  if (/^(ex|su|sp)$/i.test(tag)) return tag.toLowerCase() === "ex" ? "Extraordinary" : tag.toLowerCase() === "su" ? "Supernatural" : "Spell-like";
  if (/^[A-Z0-9]{2,}$/.test(tag) || /[—–]/.test(tag)) return tag;
  return tag.replace(/[A-Za-z0-9]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function parseTitle(raw) {
  let name = raw.replace(/\s+/g, " ").trim();
  const tags = [];
  name = name.replace(/\[([^\]]+)\]/g, (_, inner) => {
    for (const part of inner.split(",")) {
      const tag = prettyTag(part);
      if (tag) tags.push(tag);
    }
    return " ";
  });
  name = name.replace(/\(([^)]+)\)/g, (full, inner) => {
    const parts = inner.split(",").map((part) => part.trim()).filter(Boolean);
    if (!parts.every((part) => part.length <= 40 && part.split(/\s+/).length <= 4)) return full;
    for (const part of parts) {
      const tag = prettyTag(part);
      if (tag) tags.push(tag);
    }
    return " ";
  });
  name = name.replace(/\s+/g, " ").trim();
  return { name: name || raw.trim(), tags: [...new Set(tags)] };
}

function categoryFromSection(sectionTitle, sphereLabel) {
  const title = sectionTitle.replace(/\s+/g, " ").trim();
  if (/drawbacks?$/i.test(title)) return "Drawback";
  if (/exceptional|legendary/i.test(title)) return /legendary/i.test(title) ? "Legendary" : "Exceptional";
  const stripped = title.replace(/\s+talents$/i, "").replace(/^tech sphere\s+/i, "").trim();
  if (!stripped || stripped.toLowerCase() === sphereLabel.toLowerCase()) return "Talent";
  return stripped;
}

function blankFeat(icon) {
  return {
    effects: [],
    img: icon,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: { pf1: {}, pf1spheres: {} },
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
        immuneToMorale: false, loseDexToAC: false, noMediumEncumbrance: false, noHeavyEncumbrance: false,
        mediumArmorFullSpeed: false, heavyArmorFullSpeed: false, lowLightVision: false, seeInvisibility: false, seeInDarkness: false,
      },
      contextNotes: [],
      links: { children: [], charges: [] },
      tag: "",
      armorProf: [],
      weaponProf: [],
      languages: [],
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      subType: "classFeat",
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
    },
    _stats: {
      coreVersion: "13.351", systemId: "pf1", systemVersion: "11.11",
      createdTime: 1759280000000, modifiedTime: 1759280000000,
      lastModifiedBy: null, compendiumSource: null, duplicateSource: null, exportSource: null,
    },
  };
}

function sourceLine(slug, label) {
  return `<p><em>${SOURCE} <a href="https://spheresofpower.wikidot.com/${slug}">${escapeHtml(label)}</a>.</em></p>`;
}

function buildSphere(sphere, html) {
  const content = tabContent(html);
  const headings = headingsOf(content);
  const intro = headings.length ? cleanFragment(content.slice(0, headings[0].start)) : cleanFragment(content);
  const stack = [];
  for (const node of headings) {
    while (stack.length && stack.at(-1).level >= node.level) stack.pop();
    node.kind = classifyTalent(node.title, stack.at(-1)?.kind);
    node.parentTitle = stack.at(-1)?.title ?? "";
    stack.push(node);
  }

  const folderId = foundryId(`${PACK_ID}|expanded-sphere|${sphere.key}`);
  const folder = folderDoc(folderId, sphere.label, null, SPHERES.findIndex((entry) => entry.key === sphere.key));
  const baseParts = [sourceLine(sphere.slug, sphere.label)];
  if (textOf(intro)) baseParts.push(intro);
  const documents = [];
  const entries = [];
  let sort = 1000;

  for (const node of headings) {
    if (node.kind === "skip") continue;
    if (node.kind === "entry-child" || node.kind === "drawback-child") {
      const parent = [...entries].reverse().find((entry) => entry.raw === node.parentTitle);
      const chunk = `<h3>${escapeHtml(node.title)}</h3>\n${node.body}`;
      if (parent) parent.html += `\n${chunk}`;
      else baseParts.push(chunk);
      continue;
    }
    if (["base", "base-child", "rules", "rules-section"].includes(node.kind)) {
      const tag = node.kind === "base" || node.kind === "rules-section" ? "h2" : "h3";
      baseParts.push(`<${tag}>${escapeHtml(node.title)}</${tag}>`);
      if (node.body) baseParts.push(node.body);
      continue;
    }
    if (node.kind === "talent-section" || node.kind === "drawback-section") {
      if (textOf(node.body)) baseParts.push(`<h2>${escapeHtml(node.title)}</h2>`, node.body);
      continue;
    }
    if (node.kind !== "entry" && node.kind !== "drawback") continue;
    const section = [...headings].reverse().find((candidate) =>
      (candidate.kind === "talent-section" || candidate.kind === "drawback-section") && candidate.start < node.start && candidate.level < node.level);
    const category = categoryFromSection(section?.title || "Talents", sphere.label);
    const parsed = parseTitle(node.title);
    entries.push({
      raw: node.title,
      name: parsed.name,
      tags: [category, ...parsed.tags.filter((tag) => tag !== category)],
      category,
      drawback: node.kind === "drawback",
      html: node.body,
      sort,
    });
    sort += 1000;
  }

  const seen = new Map();
  for (const entry of entries) {
    const count = (seen.get(entry.name.toLowerCase()) ?? 0) + 1;
    seen.set(entry.name.toLowerCase(), count);
    if (count > 1) entry.name = `${entry.name} (${entry.tags.find((tag) => ["DRS", "LG", "SM—", "3PP"].includes(tag)) || entry.category} ${count})`;
  }

  const base = blankFeat(sphere.icon);
  base._id = foundryId(`${PACK_ID}|sphere|${sphere.key}|base`);
  base.name = sphere.label;
  base.type = "feat";
  base.folder = folderId;
  base.system.subType = sphere.kind === "skill" ? "skillTalent" : "combatTalent";
  base.system.tags = ["Base"];
  base.flags.pf1spheres = { sphere: sphere.key };
  base.flags[PACK_ID] = { wiki: `https://spheresofpower.wikidot.com/${sphere.slug}`, category: "Base" };
  base.system.description.value = baseParts.join("\n");
  if (sphere.kind === "skill") {
    base.system.changes = [{
      _id: foundryId(`${base._id}|ranks`).slice(0, 8),
      formula: `min(5 * @spheres.talents.${sphere.key}.value, @attributes.hd.total)`,
      operator: "add",
      target: "bonusSkillRanks",
      type: "untyped",
      priority: 0,
      value: 0,
      flavor: `${sphere.label} sphere skill ranks`,
    }];
  }
  documents.push(base);

  for (const entry of entries) {
    const doc = blankFeat(sphere.icon);
    doc._id = foundryId(`${PACK_ID}|sphere|${sphere.key}|${entry.raw}|${entry.sort}`);
    doc.name = entry.name;
    doc.folder = folderId;
    doc.sort = entry.sort;
    doc.system.subType = base.system.subType;
    doc.system.tags = entry.tags;
    doc.flags.pf1spheres = { sphere: sphere.key };
    if (entry.drawback) doc.flags.pf1spheres.countExcluded = true;
    doc.flags[PACK_ID] = { category: entry.category, wiki: `https://spheresofpower.wikidot.com/${sphere.slug}` };
    doc.system.description.value = [sourceLine(sphere.slug, sphere.label), `<p><strong>${escapeHtml(entry.raw)}</strong></p>`, entry.html || ""].join("\n");
    documents.push(doc);
  }
  return { folder, documents };
}

function folderDoc(id, name, parent, sort, color = "#4b0092") {
  return {
    _id: id,
    name,
    type: "Item",
    description: "",
    folder: parent,
    sorting: "m",
    sort,
    color,
    flags: {},
    _stats: { coreVersion: "13.351", systemId: "pf1", systemVersion: "11.11", createdTime: 1759280000000, modifiedTime: 1759280000000, lastModifiedBy: null },
  };
}

function blankSkills() {
  return Object.fromEntries(ALL_SKILL_IDS.map((id) => [id, false]));
}

function parseClassSkills(text) {
  const skills = blankSkills();
  const without = text.match(/without trade traditions:\s*([\s\S]{0,700})/i);
  const source = without ? without[1] : text;
  const match = source.match(/class skills(?:\s+are|:)\s+([^.]+)/i);
  if (!match) return skills;
  const chunk = match[1].toLowerCase();
  if (/knowledge \(any|all knowledge|knowledge \(all/.test(chunk)) {
    for (const id of Object.values(KNOWLEDGE)) skills[id] = true;
  }
  for (const [name, id] of Object.entries(KNOWLEDGE)) {
    if (chunk.includes(`knowledge (${name})`)) skills[id] = true;
  }
  const names = Object.keys(SKILL_KEYS).sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (chunk.includes(name)) skills[SKILL_KEYS[name]] = true;
  }
  return skills;
}

function parseProfs(text) {
  const lower = text.toLowerCase();
  const slice = (lower.match(/proficienc[\s\S]{0,500}/) ?? [lower])[0];
  const armor = [];
  const weapons = [];
  if (/simple weapons/.test(slice)) weapons.push("simple");
  if (/martial weapons/.test(slice)) weapons.push("martial");
  if (/light armor/.test(slice)) armor.push("lgt");
  if (/medium armor/.test(slice)) armor.push("med");
  if (/heavy armor/.test(slice)) armor.push("hvy");
  if (/\bshields?\b/.test(slice)) armor.push("shl");
  if (/buckler/.test(slice)) armor.push("Buckler");
  return { armorProf: [...new Set(armor)], weaponProf: [...new Set(weapons)] };
}

function parseTables(html) {
  const tables = [];
  const re = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  while ((match = re.exec(html))) {
    const rows = [...match[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
      [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textOf(cell[1])));
    if (rows.some((row) => row.some((cell) => /attack bonus|^bab$/i.test(String(cell).trim())))) tables.push(rows);
  }
  return tables;
}

function progressionFromTable(rows) {
  const headerIndex = rows.findIndex((row) => row.some((cell) => /attack bonus|^bab$/i.test(String(cell).trim())));
  if (headerIndex < 0) return null;
  const header = rows[headerIndex].map((cell) => String(cell ?? "").toLowerCase());
  const col = (pattern) => header.findIndex((cell) => pattern.test(cell));
  const levelCol = col(/^level|class level/);
  const babCol = col(/attack bonus|^bab$/);
  const fortCol = col(/fort/);
  const refCol = col(/reflex|^ref/);
  const willCol = col(/will/);
  const specialCol = col(/special/);
  const data = rows.slice(headerIndex + 1).map((row) => ({
    level: Number.parseInt(row[levelCol] ?? row[0], 10),
    bab: row[babCol] ?? "",
    fort: fortCol >= 0 ? row[fortCol] : "",
    ref: refCol >= 0 ? row[refCol] : "",
    will: willCol >= 0 ? row[willCol] : "",
    special: specialCol >= 0 ? row[specialCol] ?? "" : "",
  })).filter((row) => Number.isFinite(row.level));
  const at = (level) => data.find((row) => row.level === level) ?? data.at(-1);
  const sample = at(5) ?? at(4) ?? data[1];
  const babNumber = Math.max(...String(sample?.bab ?? "0").split("/").map((part) => Number.parseInt(part, 10) || 0));
  let bab = "med";
  if (sample?.level >= 4) {
    const per = babNumber / sample.level;
    bab = per >= 0.9 ? "high" : per >= 0.6 ? "med" : "low";
  }
  const saveValue = (cell, level) => {
    const n = Number.parseInt(String(cell).replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(n) || !level) return null;
    return n >= Math.ceil(level / 2) ? "high" : "low";
  };
  return {
    bab,
    saves: {
      fort: saveValue(sample?.fort, sample?.level) ?? "low",
      ref: saveValue(sample?.ref, sample?.level) ?? "low",
      will: saveValue(sample?.will, sample?.level) ?? "low",
    },
    rows: data,
  };
}

function savesFromProse(text, fallback) {
  const saves = { ...fallback };
  const good = text.match(/good ([^.]+?) saves/i)?.[1]?.toLowerCase() ?? "";
  const poor = text.match(/poor ([^.]+?) saves/i)?.[1]?.toLowerCase() ?? "";
  for (const [word, key] of [["fortitude", "fort"], ["reflex", "ref"], ["will", "will"]]) {
    if (good.includes(word)) saves[key] = "high";
    if (poor.includes(word)) saves[key] = "low";
  }
  // Some classes (Cyborg) list good saves per path instead of in the table.
  let listed = false;
  for (const match of text.matchAll(/good saves:\s*([a-zA-Z ,/]+)/gi)) {
    const list = match[1].toLowerCase();
    if (list.includes("fort")) saves.fort = "high";
    if (list.includes("ref")) saves.ref = "high";
    if (list.includes("will")) saves.will = "high";
    listed = true;
  }
  if (listed) return saves;
  return saves;
}

function casterProgression(text) {
  if (/full caster|caster level equal to (?:her|his|their|its )?(?:class )?level|high caster/i.test(text)) return "high";
  if (/3\/4|mid(?:-|\s)?caster|three-quarters/i.test(text)) return "mid";
  if (/1\/2 caster|half (?:her|his|their) (?:class )?level|low caster/i.test(text)) return "low";
  return "";
}

function featureLevel(body, title, rows) {
  const prose = `${title} ${textOf(body)}`;
  const match = prose.match(/\b(?:at|starting at)\s+(\d+)(?:st|nd|rd|th)?\s+level/i);
  if (match) return Math.min(20, Math.max(1, Number(match[1])));
  const needle = title.toLowerCase().replace(/\s*\([^)]*\)/g, "").replace(/\s*\[[^\]]*\]/g, "").trim();
  const words = needle.split(/\s+/).filter((word) => word.length > 3).slice(0, 3).join(" ");
  if (words.length >= 4) {
    const row = rows.find((entry) => entry.special.toLowerCase().includes(words));
    if (row) return row.level;
  }
  return 1;
}

function classifyClassHeading(title, parentKind, className) {
  const t = title.toLowerCase();
  if (parentKind === "skip" || isSkipTitle(title)) return "skip";
  if (/^(table|sidebar)\b/i.test(t)) return "child";
  const classKey = className.toLowerCase();
  if (t === classKey || t.startsWith("prestige class") || (t.includes(classKey) && /prestige class/.test(t))) return "chassis";
  if (/^class (features|abilities)$/.test(t) || t === "requirements") return "chassis";
  if (/^list of\b/.test(t) || /\bpaths$/.test(t) || /\bploys$/.test(t) || /\bflairs$/.test(t) || /\bfortes$/.test(t) || /\bconspirac/.test(t) || /\bmethods$/.test(t) || /\bventures$/.test(t) || /\binventions$/.test(t) || /\binsights$/.test(t)) return "group";
  if (parentKind === "feature") return "child";
  return "feature";
}

function blankClass(name, icon) {
  const doc = {
    effects: [],
    img: icon,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: { pf1: {}, pf1spheres: { casterProgression: "" } },
    type: "class",
    name,
    system: {
      description: { value: "", instructions: "", unidentified: "" },
      tags: [],
      changes: [],
      changeFlags: {
        immuneToMorale: false, loseDexToAC: false, noMediumEncumbrance: false, noHeavyEncumbrance: false,
        mediumArmorFullSpeed: false, heavyArmorFullSpeed: false, lowLightVision: false, seeInvisibility: false, seeInDarkness: false,
      },
      contextNotes: [],
      links: { children: [], classAssociations: [] },
      tag: "",
      armorProf: [],
      weaponProf: [],
      languages: [],
      flags: { boolean: {}, dictionary: {} },
      scriptCalls: [],
      subType: "base",
      level: 1,
      hd: 8,
      hp: 6,
      bab: "med",
      skillsPerLevel: 4,
      savingThrows: { fort: { value: "low" }, ref: { value: "low" }, will: { value: "low" } },
      fc: { hp: { value: 0 }, skill: { value: 0 }, alt: { value: 0, notes: "" } },
      wealth: "",
      alignment: "",
      classSkills: blankSkills(),
      customHD: "",
    },
    _stats: blankFeat(icon)._stats,
  };
  return doc;
}

function buildClass(spec, html) {
  const content = tabContent(html);
  const headings = headingsOf(content);
  const intro = headings.length ? cleanFragment(content.slice(0, headings[0].start)) : cleanFragment(content);
  const stack = [];
  for (const node of headings) {
    while (stack.length && stack.at(-1).level >= node.level) stack.pop();
    node.kind = classifyClassHeading(node.title, stack.at(-1)?.kind, spec.name);
    node.parentTitle = stack.at(-1)?.title ?? "";
    stack.push(node);
  }

  const plain = textOf(`${intro}\n${headings.filter((node) => node.kind === "chassis").map((node) => node.body).join("\n")}`);
  const table = parseTables(content).map(progressionFromTable).filter(Boolean).sort((a, b) => b.rows.length - a.rows.length)[0] ?? null;
  const hdMatch = plain.match(/hit die[^d]{0,20}d(\d+)/i);
  const hd = hdMatch ? Number(hdMatch[1]) : 8;
  const skillMatch = plain.match(/skill (?:ranks|points)[^0-9]{0,40}(\d+)/i);
  const skillsPerLevel = skillMatch ? Number(skillMatch[1]) : 4;
  const saves = savesFromProse(textOf(content), table?.saves ?? { fort: "low", ref: "low", will: "low" });

  const folderId = foundryId(`${PACK_ID}|class-folder|${spec.slug}`);
  const classId = foundryId(`${PACK_ID}|class|${spec.slug}`);
  const klass = blankClass(spec.name, "icons/svg/item-bag.svg");
  klass._id = classId;
  klass.folder = folderId;
  klass.system.subType = spec.prestige ? "prestige" : "base";
  klass.system.hd = hd;
  klass.system.hp = Math.max(1, hd - 2);
  klass.system.bab = table?.bab ?? "med";
  klass.system.skillsPerLevel = skillsPerLevel;
  klass.system.savingThrows = {
    fort: { value: saves.fort },
    ref: { value: saves.ref },
    will: { value: saves.will },
  };
  klass.system.classSkills = parseClassSkills(plain);
  klass.flags.pf1spheres.casterProgression = casterProgression(plain);
  if (/alignment:\s*any/i.test(plain)) klass.system.alignment = "";
  const profs = parseProfs(plain);
  klass.system.armorProf = profs.armorProf;
  klass.system.weaponProf = profs.weaponProf;

  const description = [sourceLine(spec.slug, spec.name)];
  if (textOf(intro)) description.push(intro);
  const features = [];
  const usedNames = new Set();
  for (const node of headings) {
    if (node.kind === "chassis") {
      if (node.body) description.push(node.body);
      continue;
    }
    if (node.kind === "group") {
      if (textOf(node.body)) description.push(`<h2>${escapeHtml(node.title)}</h2>`, node.body);
      continue;
    }
    if (node.kind === "child") {
      const parent = [...features].reverse().find((feature) => feature.raw === node.parentTitle);
      if (parent) parent.html += `\n<h3>${escapeHtml(node.title)}</h3>\n${node.body}`;
      continue;
    }
    if (node.kind !== "feature") continue;
    const parsed = parseTitle(node.title);
    let name = parsed.name;
    if (usedNames.has(name.toLowerCase())) continue;
    usedNames.add(name.toLowerCase());
    const level = featureLevel(node.body, node.title, table?.rows ?? []);
    features.push({ raw: node.title, name, html: node.body, level, tags: parsed.tags });
  }

  // Short prestige pages describe features as bold lead-ins instead of headings.
  if (features.length < 3) {
    const blob = description.join("\n");
    const re = /<p><strong>([^<]{3,70})<\/strong>(?:<[^>]+>)*\s*:?\s*([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = re.exec(blob))) {
      const title = textOf(match[1]).replace(/:$/, "");
      if (/hit die|skill|alignment|starting|requirement|class skill|table/i.test(title)) continue;
      if (usedNames.has(title.toLowerCase())) continue;
      usedNames.add(title.toLowerCase());
      features.push({ raw: title, name: title, html: `<p>${match[2]}</p>`, level: featureLevel(match[2], title, table?.rows ?? []), tags: [] });
    }
  }

  klass.system.description.value = description.join("\n");
  const featureDocs = features.map((feature, index) => {
    const doc = blankFeat(klass.img);
    doc._id = foundryId(`${PACK_ID}|class-feature|${spec.slug}|${feature.name}|${index}`);
    doc.name = feature.name;
    doc.folder = folderId;
    doc.sort = (index + 1) * 1000;
    doc.system.subType = "classFeat";
    doc.system.tags = [spec.name, ...feature.tags];
    doc.system.description.value = [sourceLine(spec.slug, spec.name), `<p><strong>${escapeHtml(feature.raw)}</strong> (level ${feature.level})</p>`, feature.html].join("\n");
    doc.flags[PACK_ID] = { class: spec.slug, level: feature.level };
    feature.id = doc._id;
    return doc;
  });
  klass.system.links.classAssociations = features
    .map((feature) => ({ level: feature.level, name: feature.name, uuid: `Compendium.${PACK_ID}.spheres-classes.Item.${feature.id}` }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return {
    folder: folderDoc(folderId, spec.name, spec.groupId, spec.sort),
    documents: [klass, ...featureDocs],
    summary: `${spec.name}: d${hd} BAB ${klass.system.bab} skills ${skillsPerLevel} saves ${saves.fort}/${saves.ref}/${saves.will} features ${featureDocs.length} CL ${klass.flags.pf1spheres.casterProgression || "-"}`,
  };
}

async function resolveClassHtml(name, slug, alternates = []) {
  const candidates = [slug, ...alternates];
  let fallback = null;
  for (const candidate of candidates) {
    const html = await loadHtml(candidate);
    const title = pageTitle(html);
    const usable = /hit die|class feature|class abilit/i.test(textOf(tabContent(html)).slice(0, 4000));
    const archetype = /archetype/i.test(title) && !/class/i.test(title);
    if (usable && !archetype) return { html, slug: candidate };
    fallback ??= { html, slug: candidate };
  }
  return fallback;
}

async function writePack(dir, folders, documents) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const db = new ClassicLevel(dir, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  await db.batch([
    ...folders.map((folder) => ({ type: "put", key: `!folders!${folder._id}`, value: JSON.stringify(folder) })),
    ...documents.map((doc) => ({ type: "put", key: `!items!${doc._id}`, value: JSON.stringify(doc) })),
  ]);
  await db.compactRange("!", "~");
  await db.close();
}

async function main() {
  const talentFolders = [];
  const talentDocs = [];
  for (const sphere of SPHERES) {
    const html = await loadHtml(sphere.slug);
    const built = buildSphere(sphere, html);
    if (sphere.appendSlugs) {
      const base = built.documents[0];
      for (const slug of sphere.appendSlugs) {
        const extra = await loadHtml(slug);
        const content = tabContent(extra);
        base.system.description.value += `\n<h2>${escapeHtml(pageTitle(extra))}</h2>\n${cleanFragment(content)}`;
      }
    }
    talentFolders.push(built.folder);
    talentDocs.push(...built.documents);
    const byTag = {};
    for (const doc of built.documents) byTag[doc.system.tags[0]] = (byTag[doc.system.tags[0]] ?? 0) + 1;
    console.log(`${sphere.label}: ${built.documents.length}`, JSON.stringify(byTag));
  }

  const classFolders = [];
  const classDocs = [];
  let groupSort = 0;
  for (const [groupName, prestige, entries] of CLASSES) {
    const groupId = foundryId(`${PACK_ID}|class-group|${groupName}`);
    classFolders.push(folderDoc(groupId, groupName, null, groupSort * 100000, prestige ? "#6b3fa0" : "#7a2f2f"));
    groupSort += 1;
    let classSort = 0;
    for (const [name, slug, alternates] of entries) {
      const resolved = await resolveClassHtml(name, slug, alternates ?? []);
      const built = buildClass({ name, slug: resolved.slug, prestige, groupId, sort: classSort }, resolved.html);
      classSort += 1;
      classFolders.push(built.folder);
      classDocs.push(...built.documents);
      console.log(built.summary, resolved.slug === slug ? "" : `(from /${resolved.slug})`);
    }
  }

  console.log(`talents ${talentDocs.length} + ${talentFolders.length} folders; classes/features ${classDocs.length} + ${classFolders.length} folders`);
  if (DRY) return;
  await writePack(TALENT_PACK, talentFolders, talentDocs);
  await writePack(CLASS_PACK, classFolders, classDocs);
  console.log("Wrote", TALENT_PACK);
  console.log("Wrote", CLASS_PACK);
}

await main();
