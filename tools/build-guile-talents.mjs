/**
 * Builds the Spheres of Guile skill-talent compendium from the public
 * Spheres of Power Wiki (Open Game Content, OGL 1.0a).
 *
 * Usage (from Critical-Fail-Shared):
 *   node tools/build-guile-talents.mjs
 *   node tools/build-guile-talents.mjs --dry
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
const PACK_DIR = path.join(MODULE_ROOT, "packs", "guile-skill-talents");
const INDEX_PATH = path.join(__dirname, "guile-talent-index.json");
const CACHE_DIR = path.join(process.env.TEMP || "/tmp", "guile-html");
const DRY = process.argv.includes("--dry");

const SPHERES = [
  { key: "artifice", label: "Artifice", slug: "artifice", icon: "systems/pf1/icons/skills/mech_10.jpg" },
  { key: "bluster", label: "Bluster", slug: "bluster", icon: "systems/pf1/icons/skills/red_01.jpg" },
  { key: "bodyControl", label: "Body Control", slug: "body-control", icon: "systems/pf1/icons/skills/green_01.jpg" },
  { key: "communication", label: "Communication", slug: "communication", icon: "systems/pf1/icons/skills/blue_01.jpg" },
  { key: "faction", label: "Faction", slug: "faction", icon: "systems/pf1/icons/skills/yellow_10.jpg" },
  { key: "herbalism", label: "Herbalism", slug: "herbalism", icon: "systems/pf1/icons/skills/nature_01.jpg" },
  { key: "infiltration", label: "Infiltration", slug: "infiltration", icon: "systems/pf1/icons/skills/shadow_01.jpg" },
  { key: "investigation", label: "Investigation", slug: "investigation", icon: "systems/pf1/icons/skills/blue_20.jpg" },
  { key: "navigation", label: "Navigation", slug: "navigation", icon: "systems/pf1/icons/skills/water_01.jpg" },
  { key: "performance", label: "Performance", slug: "performance", icon: "systems/pf1/icons/skills/violet_01.jpg" },
  { key: "spellhacking", label: "Spellhacking", slug: "spellhacking", icon: "systems/pf1/icons/skills/violet_12.jpg" },
  { key: "study", label: "Study", slug: "study", icon: "systems/pf1/icons/skills/yellow_20.jpg" },
  { key: "subterfuge", label: "Subterfuge", slug: "subterfuge", icon: "systems/pf1/icons/skills/shadow_12.jpg" },
  { key: "survivalism", label: "Survivalism", slug: "survivalism", icon: "systems/pf1/icons/skills/nature_06.jpg" },
  { key: "vocation", label: "Vocation", slug: "vocation", icon: "systems/pf1/icons/skills/yellow_36.jpg" }
];

const SOURCE_NOTE = "Open Game Content from Spheres of Guile and related Spheres publications (Drop Dead Studios and other publishers), compiled from the Spheres of Power Wiki under the Open Game License 1.0a.";

/** Base sphere text: "5 ranks ..., plus 5 ranks per additional talent spent in the X sphere (maximum ranks equal to your Hit Dice)". */
const RANKS_PER_TALENT_RE = /plus 5 ranks per additional talent spent in the [\w\s]+? sphere/i;
/** Vocation-style text: "gain ranks in ... equal to your total Hit Dice". */
const RANKS_PER_HD_RE = /gain ranks in [^.]*? equal to your (?:total )?Hit Dice/i;

/**
 * Builds the PF1 Change that grants the skill ranks a talent describes.
 * The ranks land in the actor's bonus skill rank pool (PF1 has no per-skill rank target),
 * so the player assigns them to the sphere's associated skill.
 */
function skillRankChange(sphere, doc, mode) {
  const formula = mode === "perTalent"
    ? `min(5 * @spheres.talents.${sphere.key}.value, @attributes.hd.total)`
    : "@attributes.hd.total";
  return {
    _id: foundryId(`${doc._id}|skill-ranks`).slice(0, 8),
    formula,
    operator: "add",
    target: "bonusSkillRanks",
    type: "untyped",
    priority: 0,
    value: 0,
    flavor: doc.system.tags.includes("Base")
      ? `${sphere.label} sphere skill ranks`
      : `${doc.name} skill ranks (${sphere.label})`
  };
}

function skillRankMode(doc) {
  const text = htmlToText(doc.system.description.value);
  if (RANKS_PER_TALENT_RE.test(text)) return "perTalent";
  // Base entries also carry the sphere's talent-type rules text, so only individual talents match the HD wording.
  if (doc.system.tags.includes("Base")) return null;
  if (doc.system.tags.includes("Specialty")) return "perHD";
  if (RANKS_PER_HD_RE.test(text)) return "perHD";
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function textLength(html) {
  return htmlToText(html).length;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sliceBalancedDiv(html, openTagIndex) {
  const openEnd = html.indexOf(">", openTagIndex);
  if (openEnd < 0) return "";
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
  const re = new RegExp(`<div\\s+id="${id}"[^>]*>`, "i");
  const match = re.exec(html);
  if (!match) return null;
  return sliceBalancedDiv(html, match.index);
}

function removeFirstDivOfClass(html, className) {
  const re = new RegExp(`<div\\s+class="${className}"[^>]*>`, "i");
  const match = re.exec(html);
  if (!match) return html;
  const innerStart = html.indexOf(">", match.index) + 1;
  const block = sliceBalancedDiv(html, match.index);
  const end = innerStart + block.length;
  const close = html.indexOf("</div>", end);
  return html.slice(0, match.index) + html.slice(close >= 0 ? close + 6 : end);
}

function foundryId(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += alphabet[hash[i] % alphabet.length];
  return id;
}

function prettyTag(raw) {
  const tag = raw.replace(/\s+/g, " ").trim();
  if (!tag) return null;
  if (/^(ex|su|sp)$/i.test(tag)) {
    if (/^ex$/i.test(tag)) return "Extraordinary";
    if (/^su$/i.test(tag)) return "Supernatural";
    return "Spell-like";
  }
  if (/^[A-Z0-9]{2,}$/.test(tag) || /[—–]/.test(tag)) return tag;
  return tag.replace(/[A-Za-z0-9]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function parseTalentTitle(raw) {
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
    const short = parts.every((part) => part.length <= 40 && part.split(/\s+/).length <= 4);
    if (!short) return full;
    for (const part of parts) {
      const tag = prettyTag(part);
      if (tag) tags.push(tag);
    }
    return " ";
  });
  name = name.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return { name: name || raw.trim(), tags: [...new Set(tags)] };
}

function categoryFromSection(sectionTitle, sphereLabel) {
  const title = sectionTitle.replace(/\s+/g, " ").trim();
  if (/drawbacks?$/i.test(title)) return "Drawback";
  if (/exceptional talents$/i.test(title)) return "Exceptional";
  const stripped = title.replace(/\s+talents$/i, "").trim();
  if (!stripped || stripped.toLowerCase() === sphereLabel.toLowerCase()) return "Talent";
  return stripped;
}

function isSkipTitle(title) {
  const t = title.toLowerCase();
  return /archetype|specializing in|class option|\bfeats?\b/.test(t);
}

function isSectionTitle(title) {
  const t = title.toLowerCase();
  return /talents$/.test(t) || /drawbacks?$/.test(t) || /packages?$/.test(t) || /talent types$/.test(t);
}

function sectionKind(title) {
  const t = title.toLowerCase();
  if (/drawbacks?$/.test(t)) return "drawback-section";
  if (/packages?$/.test(t) || /talent types$/.test(t)) return "rules-section";
  return "talent-section";
}

function classify(title, parentKind) {
  if (parentKind === "skip") return "skip";
  if (/^(table|sidebar)\b/i.test(title)) {
    if (parentKind === "drawback" || parentKind === "drawback-child") return "drawback-child";
    if (parentKind === "entry" || parentKind === "entry-child") return "entry-child";
    return "base-child";
  }
  if (parentKind === "rules" || parentKind === "rules-section") return "rules";
  if (parentKind === "entry" || parentKind === "entry-child") return "entry-child";
  if (parentKind === "drawback" || parentKind === "drawback-child") return "drawback-child";
  if (parentKind === "talent-section") return "entry";
  if (parentKind === "drawback-section") return "drawback";
  if (isSkipTitle(title)) return "skip";
  if (parentKind === "base" || parentKind === "base-child") {
    if (isSectionTitle(title)) return sectionKind(title);
    return "base-child";
  }
  if (isSectionTitle(title)) return sectionKind(title);
  return "base";
}

function cleanFragment(html) {
  let out = html;
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<span\b[^>]*line-through[^>]*>([\s\S]*?)<\/span>/gi, "<s>$1</s>");
  out = out.replace(/<\/?span\b[^>]*>/gi, "");
  out = out.replace(/<a\b[^>]*href="javascript:[^"]*"[^>]*>/gi, "");
  out = out.replace(/<a\b([^>]*?)href="\/([^"]+)"([^>]*)>/gi, (_m, pre, href, post) => {
    return `<a${pre}href="https://spheresofpower.wikidot.com/${href}"${post}>`;
  });
  out = out.replace(/<h1\b/gi, "<h3").replace(/<\/h1>/gi, "</h3>");
  out = out.replace(/<h2\b/gi, "<h3").replace(/<\/h2>/gi, "</h3>");
  out = out.replace(/<table\b([^>]*)>/gi, (_m, attrs) => {
    const withoutStyle = attrs.replace(/\sstyle="[^"]*"/gi, "");
    return `<table${withoutStyle} style="width:100%;border-collapse:collapse" border="1">`;
  });
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

function headingTag(kind) {
  if (kind === "base" || kind === "rules-section") return "h2";
  return "h3";
}

async function loadPage(sphere) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, `${sphere.slug}.html`);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    const url = `https://spheresofpower.wikidot.com/${sphere.slug}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    fs.writeFileSync(dest, await response.text());
    await sleep(200);
  }
  return fs.readFileSync(dest, "utf8");
}

function parsePage(html) {
  const tocHtml = extractDivById(html, "toc-list");
  if (!tocHtml) throw new Error("Missing table of contents");
  const toc = [];
  const tocRe = /<div style="margin-left:\s*(\d+)em;"><a href="#([^"]+)">([\s\S]*?)<\/a><\/div>/gi;
  let tocMatch;
  while ((tocMatch = tocRe.exec(tocHtml))) {
    toc.push({
      indent: Number(tocMatch[1]),
      id: tocMatch[2],
      title: htmlToText(tocMatch[3])
    });
  }

  let content = extractDivById(html, "wiki-tab-0-0") || extractDivById(html, "page-content");
  if (!content) throw new Error("Missing page content");
  content = removeFirstDivOfClass(content, "noselect");

  const headings = [];
  const headingRe = /<h([1-6])\b[^>]*\bid="(toc\d+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch;
  while ((headingMatch = headingRe.exec(content))) {
    headings.push({
      level: Number(headingMatch[1]),
      id: headingMatch[2],
      title: htmlToText(headingMatch[3]),
      start: headingMatch.index,
      end: headingMatch.index + headingMatch[0].length
    });
  }
  const byId = new Map(headings.map((heading) => [heading.id, heading]));
  const intro = cleanFragment(content.slice(0, headings[0]?.start ?? content.length));

  const stack = [];
  for (const node of toc) {
    while (stack.length && stack.at(-1).indent >= node.indent) stack.pop();
    const parent = stack.at(-1);
    node.kind = classify(node.title, parent?.kind);
    node.parentTitle = parent?.title ?? "";
    const heading = byId.get(node.id);
    if (!heading) {
      node.body = "";
      node.missing = true;
    } else {
      const next = headings.find((candidate) => candidate.start > heading.start && toc.some((entry) => entry.id === candidate.id));
      const raw = content.slice(heading.end, next ? next.start : content.length);
      node.body = cleanFragment(raw.replace(/<hr\s*\/?>/gi, ""));
    }
    stack.push(node);
  }
  return { intro, toc };
}

function blankFeat(sphere) {
  return {
    effects: [],
    img: sphere.icon,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {
      pf1: {},
      pf1spheres: { sphere: sphere.key }
    },
    type: "feat",
    system: {
      description: { value: "", instructions: "", unidentified: "" },
      tags: [],
      actions: [],
      attackNotes: [],
      effectNotes: [],
      uses: {
        value: 0,
        per: null,
        autoDeductChargesCost: "1",
        maxFormula: "",
        rechargeFormula: ""
      },
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
      subType: "skillTalent",
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
      ability: {
        attack: null,
        critMult: 2,
        critRange: 20,
        damage: null,
        damageMult: 1
      },
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

function sourceLine(sphere, anchor) {
  const url = `https://spheresofpower.wikidot.com/${sphere.slug}${anchor ? `#${anchor}` : ""}`;
  return `<p><em>Open Game Content. <a href="${url}">${escapeHtml(sphere.label)} on the Spheres of Power Wiki</a> (OGL 1.0a).</em></p>`;
}

function buildSphere(sphere, parsed) {
  const folderId = foundryId(`critical-fail-shared|guile-folder|${sphere.key}`);
  const folder = {
    _id: folderId,
    name: sphere.label,
    type: "Item",
    description: sourceLine(sphere),
    folder: null,
    sorting: "m",
    sort: SPHERES.findIndex((entry) => entry.key === sphere.key) * 100000,
    color: "#4b0092",
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

  const baseParts = [`<p><em>${escapeHtml(SOURCE_NOTE)}</em></p>`, sourceLine(sphere)];
  if (parsed.intro && textLength(parsed.intro) > 0) baseParts.push(parsed.intro);

  const sectionTitle = new Map();
  const talents = [];
  let sort = 1000;
  for (const node of parsed.toc) {
    if (node.kind === "talent-section" || node.kind === "drawback-section") {
      sectionTitle.set(node.id, node.title);
      if (textLength(node.body) > 0) {
        baseParts.push(`<h2>${escapeHtml(node.title)}</h2>`, node.body);
      }
      continue;
    }
    if (node.kind === "entry-child" || node.kind === "drawback-child") {
      const parent = [...talents].reverse().find((talent) => talent.raw === node.parentTitle);
      const chunk = `<h3>${escapeHtml(node.title)}</h3>\n${node.body}`;
      if (parent) parent.html += `\n${chunk}`;
      else baseParts.push(chunk);
      continue;
    }
    if (["base", "base-child", "rules", "rules-section"].includes(node.kind)) {
      const tag = headingTag(node.kind);
      baseParts.push(`<${tag}>${escapeHtml(node.title)}</${tag}>`);
      if (node.body) baseParts.push(node.body);
      continue;
    }
    if (node.kind !== "entry" && node.kind !== "drawback") continue;

    const section = [...parsed.toc].reverse().find((candidate) =>
      candidate.kind.endsWith("section")
      && parsed.toc.indexOf(candidate) < parsed.toc.indexOf(node)
      && candidate.indent < node.indent
    );
    const category = categoryFromSection(section?.title || "Talents", sphere.label);
    const parsedTitle = parseTalentTitle(node.title);
    const tags = [category, ...parsedTitle.tags.filter((tag) => tag !== category)];
    talents.push({
      raw: node.title,
      name: parsedTitle.name,
      tags,
      category,
      drawback: node.kind === "drawback",
      anchor: node.id,
      html: node.body,
      sort,
      missing: node.missing
    });
    sort += 1000;
  }

  const nameCounts = new Map();
  for (const talent of talents) nameCounts.set(talent.name.toLowerCase(), (nameCounts.get(talent.name.toLowerCase()) || 0) + 1);
  const used = new Set();
  for (const talent of talents) {
    let name = talent.name;
    if ((nameCounts.get(name.toLowerCase()) || 0) > 1) {
      const source = talent.tags.find((tag) => ["DRS", "LG", "SM—", "LotS", "CS", "Wiki", "3PP"].includes(tag));
      name = source ? `${talent.name} (${source})` : `${talent.name} (${talent.category})`;
    }
    let unique = name;
    let n = 2;
    while (used.has(unique.toLowerCase())) {
      unique = `${name} ${n}`;
      n += 1;
    }
    used.add(unique.toLowerCase());
    talent.name = unique;
  }

  const base = blankFeat(sphere);
  base._id = foundryId(`critical-fail-shared|guile|${sphere.key}|base`);
  base.name = sphere.label;
  base.folder = folderId;
  base.sort = 0;
  // Gaining the sphere costs a talent, so the base entry counts toward the sphere's talent total.
  base.flags.pf1spheres.countExcluded = false;
  base.flags["critical-fail-shared"] = {
    wiki: `https://spheresofpower.wikidot.com/${sphere.slug}`,
    category: "Base"
  };
  base.system.tags = ["Base"];
  base.system.description.value = baseParts.join("\n");

  const documents = [base];
  for (const talent of talents) {
    const doc = blankFeat(sphere);
    doc._id = foundryId(`critical-fail-shared|guile|${sphere.key}|${talent.anchor}|${talent.raw}`);
    doc.name = talent.name;
    doc.folder = folderId;
    doc.sort = talent.sort;
    if (talent.drawback) doc.flags.pf1spheres.countExcluded = true;
    doc.flags["critical-fail-shared"] = {
      wiki: `https://spheresofpower.wikidot.com/${sphere.slug}#${talent.anchor}`,
      category: talent.category
    };
    doc.system.tags = talent.tags;
    doc.system.description.value = [
      sourceLine(sphere, talent.anchor),
      `<p><strong>${escapeHtml(talent.raw)}</strong></p>`,
      talent.html || "<p><em>No additional rules text was listed for this talent.</em></p>"
    ].join("\n");
    documents.push(doc);
  }

  const rankGrants = [];
  for (const doc of documents) {
    const mode = skillRankMode(doc);
    if (!mode) continue;
    doc.system.changes = [skillRankChange(sphere, doc, mode)];
    doc.flags["critical-fail-shared"].skillRanks = mode;
    rankGrants.push({ name: doc.name, mode });
  }

  return { folder, documents, talents, rankGrants };
}

async function main() {
  const folders = [];
  const documents = [];
  const index = [];
  const warnings = [];

  for (const sphere of SPHERES) {
    const html = await loadPage(sphere);
    const parsed = parsePage(html);
    const missing = parsed.toc.filter((node) => node.missing);
    if (missing.length) warnings.push(`${sphere.label}: ${missing.length} TOC entries had no heading`);
    const built = buildSphere(sphere, parsed);
    folders.push(built.folder);
    documents.push(...built.documents);
    const counts = {};
    for (const doc of built.documents) {
      const category = doc.system.tags[0] || "?";
      counts[category] = (counts[category] || 0) + 1;
    }
    console.log(`${sphere.label}: ${built.documents.length} entries`, JSON.stringify(counts));
    if (built.rankGrants.length) {
      const perTalent = built.rankGrants.filter((grant) => grant.mode === "perTalent").map((grant) => grant.name);
      const perHD = built.rankGrants.filter((grant) => grant.mode === "perHD").map((grant) => grant.name);
      if (perTalent.length) console.log(`  ranks (5/talent, max HD): ${perTalent.join(", ")}`);
      if (perHD.length) console.log(`  ranks (= HD): ${perHD.length} entries: ${perHD.slice(0, 4).join(", ")}${perHD.length > 4 ? ", ..." : ""}`);
    }
    for (const doc of built.documents) {
      index.push({
        sphere: sphere.key,
        name: doc.name,
        category: doc.system.tags[0],
        tags: doc.system.tags,
        excluded: doc.flags.pf1spheres.countExcluded === true,
        skillRanks: doc.flags["critical-fail-shared"].skillRanks ?? null,
        id: doc._id
      });
      if (textLength(doc.system.description.value) < 40) {
        warnings.push(`${sphere.label}: short description for ${doc.name}`);
      }
    }
  }

  const ids = new Set();
  for (const doc of [...folders, ...documents]) {
    if (ids.has(doc._id)) warnings.push(`Duplicate id ${doc._id} on ${doc.name}`);
    ids.add(doc._id);
  }
  const names = new Map();
  for (const doc of documents) {
    const key = `${doc.flags.pf1spheres.sphere}:${doc.name.toLowerCase()}`;
    if (names.has(key)) warnings.push(`Duplicate name ${doc.name} in ${doc.flags.pf1spheres.sphere}`);
    names.set(key, true);
  }

  console.log(`TOTAL documents ${documents.length} folders ${folders.length}`);
  if (warnings.length) {
    console.log("WARNINGS");
    for (const warning of warnings) console.log(" -", warning);
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  if (DRY) return;

  fs.rmSync(PACK_DIR, { recursive: true, force: true });
  fs.mkdirSync(PACK_DIR, { recursive: true });
  const db = new ClassicLevel(PACK_DIR, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();
  const ops = [
    ...folders.map((folder) => ({ type: "put", key: `!folders!${folder._id}`, value: JSON.stringify(folder) })),
    ...documents.map((doc) => ({ type: "put", key: `!items!${doc._id}`, value: JSON.stringify(doc) }))
  ];
  await db.batch(ops);
  await db.compactRange("!", "~");
  await db.close();
  console.log(`Wrote ${ops.length} records to ${PACK_DIR}`);
}

await main();
