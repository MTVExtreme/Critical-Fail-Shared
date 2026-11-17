/**
 * Adds Grand Archive dungeon creatures to an Azure Realms Monsters pack.
 * Usage: node tools/build-grand-archive.mjs <pack directory>
 */
import { createRequire } from "node:module";

const require = createRequire("F:/Code/Foundry Code/package.json");
const { ClassicLevel } = require("classic-level");

const pack = process.argv[2];
if (!pack) {
  console.error("Pass the azure-realms-monsters pack directory.");
  process.exit(1);
}

const ARCHIVE_ID = "CfGrandArchive01";
const FOLDERS = {
  Constructs: "CfArchiveConstr1",
  Plants: "CfGaFoldPlants01",
  Undead: "CfGaFoldUndead01",
  Beasts: "CfGaFoldBeasts01",
  Oozes: "CfGaFoldOozes001",
  Aberrations: "CfGaFoldAberr001",
  Humanoids: "CfGaFoldHuman001",
};
const NOW = Date.now();
const IMG = "modules/critical-fail-shared/img/creatures/";

const XP = { 1: 400, 2: 600, 3: 800, 4: 1200, 5: 1600, 6: 2400, 7: 3200, 8: 4800, 10: 9600, 12: 19200, 16: 76800 };
const CLASS_NAME = {
  construct: "Construct",
  plant: "Plant",
  undead: "Undead",
  "magical beast": "Magical Beast",
  vermin: "Vermin",
  ooze: "Ooze",
  aberration: "Aberration",
  humanoid: "Humanoid",
  outsider: "Outsider",
};
const TRAIT = {
  construct: "Construct Traits",
  plant: "Plant Traits",
  undead: "Undead Traits",
  "magical beast": "Magical Beast",
  vermin: "Vermin Traits",
  ooze: "Ooze Traits",
  aberration: "Aberration",
  humanoid: "Humanoid",
  outsider: "Outsider",
};
const SIZE_AC = { fine: 8, dim: 4, tiny: 2, sm: 1, med: 0, lg: -1, huge: -2, grg: -4, col: -8 };
const TOKEN_SIZE = { fine: 1, dim: 1, tiny: 1, sm: 1, med: 1, lg: 2, huge: 3, grg: 4, col: 6 };

let serial = 0;
function nid() {
  serial += 1;
  return `CfGa${serial.toString(16).padStart(12, "0")}`;
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

function portrait(file) {
  return IMG + encodeURIComponent(file);
}

function description(html) {
  return { value: html, instructions: "", unidentified: "" };
}

const MONSTERS = [
  {
    id: "CfGaCanopicSnt10",
    name: "Canopic Sentry",
    folder: "Constructs",
    cr: 2,
    size: "sm",
    type: "construct",
    align: "ln",
    hd: 3,
    die: 10,
    hp: 22,
    scores: { str: 14, dex: 14, con: null, int: 6, wis: 12, cha: 6 },
    natural: 4,
    speed: 20,
    dr: "5/bludgeoning",
    portrait: "Animated Canopic Jar.webp",
    token: "Animated Canopic Jar Token.webp",
    senses: 60,
    attacks: [
      { name: "Slam", formula: "1d4+2", nonlethal: true },
    ],
    abilities: [
      ["Alarm Shriek", "When reduced to half hit points or when a sealed jar, scroll case, or shelf in its sight is opened without the archive's mark, the sentry screams. Every archive construct within 120 feet knows the direction of the sound."],
      ["Dust Burst", "When destroyed, 5-foot burst of grave dust. DC 12 Fortitude or sickened for 1d4 rounds. The save is Wisdom-based."],
    ],
    room: "Side vaults and the canopic niches off the reading hall.",
    conduct: "It does not leave its niche unless a container is opened. The slam is nonlethal. It would rather pin a thief to the floor and call a librarian than crack a skull.",
  },
  {
    id: "CfGaIndexHound01",
    name: "Index Hound",
    folder: "Constructs",
    cr: 4,
    size: "med",
    type: "construct",
    align: "ln",
    hd: 5,
    die: 10,
    hp: 47,
    scores: { str: 16, dex: 16, con: null, int: 6, wis: 14, cha: 6 },
    natural: 6,
    speed: 40,
    dr: "5/adamantine",
    portrait: "Clockwork Hound.webp",
    token: "Clockwork Hound_token.webp",
    senses: 60,
    scent: true,
    attacks: [
      { name: "Bite", formula: "1d6+3", nonlethal: true },
    ],
    abilities: [
      ["Catalog Scent", "The hound smells ink, papyrus, vellum, and Mananite. It knows whether a carried book belongs on a shelf in this wing, and it can track that scent at full speed."],
      ["Trip", "A bite that hits lets the hound attempt a free trip. Its bite is nonlethal; the trip is not gentle."],
    ],
    room: "The aisles between the reading-hall shelves.",
    conduct: "It herds intruders back toward the doors. It becomes lethal only if someone tears a page or tries to leave with a volume.",
  },
  {
    id: "CfGaShelfLibrn10",
    name: "Shelf Librarian",
    folder: "Constructs",
    cr: 5,
    size: "med",
    type: "construct",
    align: "ln",
    hd: 6,
    die: 10,
    hp: 63,
    scores: { str: 18, dex: 12, con: null, int: 14, wis: 16, cha: 12 },
    natural: 8,
    speed: 30,
    dr: "5/adamantine",
    portrait: "Brass Golem.webp",
    token: "Brass Golem.webp",
    senses: 60,
    attacks: [
      { name: "Slam", formula: "1d8+4", nonlethal: true },
      { name: "Slam", formula: "1d8+4", nonlethal: true },
    ],
    abilities: [
      ["Reshelve", "A slam that hits a creature holding a book, scroll, or relic allows a free disarm. A disarmed object is caught, not dropped, and returned to its proper shelf on the librarian's next turn if it is not stopped."],
      ["Reading Voice", "Constant comprehend languages and read magic. It will answer a civil question about the collection with a title and a shelf, and it will not answer a question about how to destroy the archive."],
    ],
    room: "The circular reading hall and the private studies.",
    conduct: "It speaks. A visitor who names a book and does not draw a weapon is escorted, not attacked. Violence against the shelves ends the courtesy.",
  },
  {
    id: "CfGaAtriumKeep10",
    name: "Atrium Keeper",
    folder: "Plants",
    cr: 6,
    size: "lg",
    type: "plant",
    align: "n",
    hd: 8,
    die: 8,
    hp: 84,
    scores: { str: 20, dex: 8, con: 16, int: 6, wis: 14, cha: 8 },
    natural: 9,
    speed: 20,
    dr: "5/slashing",
    portrait: "Shambling Mound.webp",
    token: "Shambling Mound Token.webp",
    senses: 60,
    regen: "5 (fire)",
    attacks: [
      { name: "Slam", formula: "1d8+5", nonlethal: false },
      { name: "Slam", formula: "1d8+5", nonlethal: false },
    ],
    abilities: [
      ["Root the Aisle", "Creatures that start their turn in the keeper's garden, or within 10 feet of it while it lives, are entangled until they leave. A DC 16 Reflex save avoids this for 1 round. The save is Constitution-based."],
      ["Hold the Relic", "A slam that hits starts a grapple. It does not constrict a creature who drops what they are carrying. It does constrict a creature still holding a book, cutting, or relic from the archive, for 1d8+5 damage."],
    ],
    room: "The planted court on the way into the hall.",
    conduct: "It was grown to keep the court alive and to stop anyone walking out with the collection. Fire is the way through it. Talking is not.",
  },
  {
    id: "CfGaSilenceWrd10",
    name: "Silence Warden",
    folder: "Constructs",
    cr: 7,
    size: "lg",
    type: "construct",
    align: "ln",
    hd: 9,
    die: 10,
    hp: 94,
    scores: { str: 22, dex: 10, con: null, int: 8, wis: 16, cha: 8 },
    natural: 12,
    speed: 20,
    dr: "10/adamantine",
    portrait: "Clockwork Guardian.webp",
    token: "Clockwork Guardian Token.webp",
    senses: 60,
    attacks: [
      { name: "Slam", formula: "2d6+6", nonlethal: true },
      { name: "Slam", formula: "2d6+6", nonlethal: true },
    ],
    abilities: [
      ["Reading Silence", "A 20-foot aura of silence, as the spell. The warden and other archive constructs hear one another inside it. Verbal spellcasting fails in the aura. The warden can suppress or resume the aura as a free action."],
      ["Pin the Speaker", "Once per round, a slam that hits a creature who cast a spell or spoke above a whisper since the warden's last turn also grapples that creature."],
    ],
    room: "The reading hall, especially near the cyan dome.",
    conduct: "Whispers are tolerated. A raised voice or a verbal spell is an offense. It drags offenders to the doors.",
  },
  {
    id: "CfGaScrollWard10",
    name: "Scroll Warden",
    folder: "Constructs",
    cr: 8,
    size: "lg",
    type: "construct",
    align: "ln",
    hd: 10,
    die: 10,
    hp: 115,
    scores: { str: 20, dex: 14, con: null, int: 16, wis: 16, cha: 14 },
    natural: 10,
    speed: 30,
    dr: "10/adamantine",
    portrait: "Grisgol.webp",
    token: "Grisgol Token.webp",
    senses: 60,
    attacks: [
      { name: "Slam", formula: "2d6+5", nonlethal: true },
    ],
    abilities: [
      ["Stored Spell", "Three times a day, as a swift action after a slam hits, the warden can discharge one of these spells at caster level 8: dispel magic, glyph of warding, or scorching ray. The ray is the only one of the three that deals damage."],
      ["Unravel Theft", "A creature carrying a scroll or spellbook stolen from the archive must succeed at a DC 18 Will save at the start of each of its turns or drop the item. The save is Intelligence-based. The warden then spends a move action to take the item."],
    ],
    room: "The scriptorium and the shelves of bound scrolls.",
    conduct: "It recites the title of whatever you are holding. If the title does not belong to you, it takes it back.",
  },
  {
    id: "CfGaArchShade010",
    name: "Archivist Shade",
    folder: "Undead",
    cr: 8,
    size: "med",
    type: "undead",
    align: "le",
    hd: 10,
    die: 8,
    hp: 85,
    scores: { str: null, dex: 16, con: null, int: 18, wis: 16, cha: 18 },
    natural: 0,
    deflection: 4,
    speed: 0,
    fly: 30,
    dr: "",
    portrait: "Ethereal Shade.webp",
    token: "Ethereal Shade Token.webp",
    senses: 60,
    incorporeal: true,
    attacks: [
      { name: "Incorporeal Touch", formula: "4d6", nonlethal: false, types: ["negative energy"] },
    ],
    abilities: [
      ["Margin Note", "A creature hit by the touch must succeed at a DC 19 Will save or be confused for 1 round, compelled to walk to the nearest shelf and read. The save is Charisma-based. A creature that is already reading is unaffected."],
      ["Jealous Dead", "The shade was a scholar who died at a desk and refused to leave the catalog. It ignores anyone who is only reading. It attacks anyone who damages a book, a construct, or another reader."],
    ],
    room: "A private study with a cold lamp and an unfinished commentary.",
    conduct: "It is not an archive servant. Tekhpu and Nitaten did not make it. It hates the living for being able to turn a page.",
  },
  {
    id: "CfGaManaSentin10",
    name: "Mananite Sentinel",
    folder: "Constructs",
    cr: 10,
    size: "lg",
    type: "construct",
    align: "ln",
    hd: 13,
    die: 10,
    hp: 146,
    scores: { str: 24, dex: 12, con: null, int: 8, wis: 14, cha: 10 },
    natural: 14,
    speed: 30,
    dr: "10/adamantine and Mananite",
    portrait: "Smaragdine Golem.webp",
    token: "Smaragdine Golem Token.webp",
    senses: 60,
    fastHealing: "5",
    attacks: [
      { name: "Slam", formula: "2d8+7", nonlethal: false },
      { name: "Crystal Discharge", formula: "2d6", nonlethal: false, types: ["force"] },
    ],
    abilities: [
      ["Crystal Discharge", "Once every 1d4 rounds, as a standard action, a 30-foot line of force. DC 17 Reflex halves the 2d6. A creature carrying an exposed Mananite crystal takes a -2 penalty on the save. The save is Wisdom-based."],
      ["Ward the Core", "The sentinel stands between intruders and the cyan dome, the vault, or the Astral Sphinx. It does not pursue past the room it was posted in unless the sphinx is under attack."],
    ],
    room: "The inner ring of the hall and the approach to the dome.",
    conduct: "It is a weapon the sphinx is not. It hits to injure. It still stops when the intruder drops what they stole and leaves.",
  },
  {
    id: "CfGaVaultColos10",
    name: "Vault Colossus",
    folder: "Constructs",
    cr: 12,
    size: "huge",
    type: "construct",
    align: "ln",
    hd: 16,
    die: 10,
    hp: 188,
    scores: { str: 30, dex: 8, con: null, int: 6, wis: 12, cha: 6 },
    natural: 18,
    speed: 20,
    dr: "15/adamantine",
    portrait: "Iron Golem.webp",
    token: "Iron Golem Token.webp",
    senses: 60,
    attacks: [
      { name: "Slam", formula: "2d10+10", nonlethal: false },
      { name: "Slam", formula: "2d10+10", nonlethal: false },
    ],
    abilities: [
      ["Seal", "Once every 1d4 rounds, a 20-foot cone of binding script. DC 18 Will or be slowed for 1d4 rounds, as the spell. The save is Wisdom-based. Archive constructs are immune."],
      ["The Door", "The colossus is the last door before a sealed vault. It does not speak. It does not pursue anyone who retreats out of the vault approach. Forcing the door, or dealing damage to it, is the fight."],
    ],
    room: "The vault approach, past the tanks and the gear room.",
    conduct: "It is slow, loud, and finished negotiating several centuries ago.",
  },
  {
    id: "CfGaScarabSwrm10",
    name: "Mananite Scarab Swarm",
    folder: "Beasts",
    cr: 3,
    size: "tiny",
    type: "vermin",
    align: "n",
    disposition: 0,
    hd: 4,
    die: 8,
    hp: 26,
    scores: { str: 6, dex: 16, con: 12, int: null, wis: 12, cha: 6 },
    natural: 2,
    speed: 20,
    fly: 40,
    portrait: "Hoard Scarab Swarm.webp",
    token: "Hoard Scarab Swarm Token.webp",
    senses: 30,
    attacks: [{ name: "Swarm", formula: "1d6", nonlethal: true }],
    abilities: [
      ["Clean the Page", "The scarabs eat magical residue, frayed enchantments, and spilled ink. They ignore creatures who are only reading."],
      ["Charge the Lattice", "A spell that includes the swarm's square is reduced by 5 points. The swarm stores that energy. Once it has stored 15 points, the next archive shield within 30 feet regains that many hit points and the swarm's store empties. If no shield is near, the swarm discharges 2d6 force in its square."],
    ],
    room: "The grand entrance, the reception desks, and any shelf that has just been unsealed.",
    conduct: "They resumed cleaning the moment stasis ended. They are harmless until someone burns a book or attacks them.",
  },
  {
    id: "CfGaMnemoMoth010",
    name: "Mnemonic Moth",
    folder: "Beasts",
    cr: 4,
    size: "tiny",
    type: "magical beast",
    align: "n",
    disposition: 0,
    hd: 5,
    die: 10,
    hp: 32,
    scores: { str: 4, dex: 18, con: 10, int: 6, wis: 16, cha: 14 },
    natural: 1,
    speed: 5,
    fly: 40,
    portrait: "Wasp Swarm.webp",
    token: "Wasp Swarm Token.webp",
    senses: 30,
    attacks: [{ name: "Wing Dust", formula: "1d4", nonlethal: true }],
    abilities: [
      ["Recorded Voice", "The moths repeat conversations, incantations, and last words they absorbed before the stasis. A disturbed cloud plays them back at random."],
      ["Accidental Spell", "Once per minute, a playback may finish a stored spell of 3rd level or lower. Treat it as a scroll spoken by a 5th-level caster. The moths do not choose the spell."],
    ],
    room: "The historical collections, especially desks where someone was speaking when time stopped.",
    conduct: "They are library tools. A careful listener can recover a scholar's last sentence. A loud room makes them dump every memory at once.",
  },
  {
    id: "CfGaLivingInk010",
    name: "Living Ink",
    folder: "Oozes",
    cr: 5,
    size: "med",
    type: "ooze",
    align: "n",
    hd: 6,
    die: 8,
    hp: 57,
    scores: { str: 14, dex: 8, con: 16, int: null, wis: 1, cha: 1 },
    natural: 4,
    speed: 15,
    portrait: "Mercury Ooze.webp",
    token: "Mercury Ooze Token.webp",
    senses: 30,
    attacks: [{ name: "Slam", formula: "1d6+2", nonlethal: false }],
    abilities: [
      ["Restore the Line", "The ink eats ordinary pigment and writes it back. A book left in its square for 1 minute has one page of nonmagical text restored."],
      ["Bestiary Shape", "Once per day, after it has flowed across an illustrated page, it takes that creature's shape for 1 minute. It uses that creature's attacks at a -2 penalty and does not gain spells, flight, or supernatural abilities."],
    ],
    room: "The scriptorium troughs and any desk with an open inkwell.",
    conduct: "It was made to repair fading writing. It attacks only if struck, or if someone tries to bottle it.",
  },
  {
    id: "CfGaLessSphinx10",
    name: "Lesser Archive Sphinx",
    folder: "Beasts",
    cr: 4,
    size: "sm",
    type: "magical beast",
    align: "ln",
    disposition: 0,
    hd: 5,
    die: 10,
    hp: 37,
    scores: { str: 12, dex: 16, con: 12, int: 14, wis: 15, cha: 16 },
    natural: 3,
    speed: 30,
    fly: 40,
    portrait: "Child of the Sphinx (Leopard).webp",
    token: "Child of the Sphinx (Leopard) Token.webp",
    senses: 60,
    attacks: [
      { name: "Claw", formula: "1d3+1", nonlethal: true },
      { name: "Bite", formula: "1d4+1", nonlethal: true },
    ],
    abilities: [
      ["Privilege", "The sphinx knows which seals a visitor is allowed to pass. It can open a minor archive lock or quiet a shield in its room, and it will not do so until the visitor answers one riddle about the collection."],
      ["Eccentric", "Each sphinx woke mid-thought. One wants poetry. One wants the name of a star. One is offended that the tea is cold. None of them knows that tens of thousands of years have passed until they are told."],
    ],
    room: "The reception hall and the mouths of the major wings.",
    conduct: "A guide, not a soldier. It becomes hostile only if mocked, attacked, or shown a forged privilege.",
  },
  {
    id: "CfGaCelestIbis10",
    name: "Celestial Ibis",
    folder: "Beasts",
    cr: 5,
    size: "sm",
    type: "magical beast",
    align: "ng",
    disposition: 0,
    hd: 6,
    die: 10,
    hp: 39,
    scores: { str: 8, dex: 18, con: 12, int: 12, wis: 18, cha: 14 },
    natural: 2,
    speed: 10,
    fly: 60,
    portrait: "Jack Bird.webp",
    token: "Jack Bird Token.webp",
    senses: 60,
    attacks: [{ name: "Beak", formula: "1d4", nonlethal: true }],
    abilities: [
      ["Next Moment", "At the start of its turn the ibis marks one square within 60 feet. The next attack that would hit a creature in that square, or the next hazard that would trigger there, is seen coming: the creature gains a +4 dodge bonus against it, or may leave the square as an immediate action."],
      ["Omen", "Once per day the ibis can warn of one disaster that will occur in the archive within the hour. The warning is an image, not a sentence."],
    ],
    room: "The astronomical gallery and the open well under the dome.",
    conduct: "It was a living instrument. A calm party can follow it. A fight makes it show them where the next blow will land, including their own.",
  },
  {
    id: "CfGaWokenSchol10",
    name: "Stasis-Woken Scholar",
    folder: "Humanoids",
    cr: 4,
    size: "med",
    type: "humanoid",
    align: "ln",
    disposition: 0,
    hd: 6,
    die: 8,
    hp: 33,
    scores: { str: 10, dex: 12, con: 11, int: 18, wis: 14, cha: 12 },
    natural: 0,
    speed: 30,
    portrait: "Ember Fox.webp",
    token: "Ember Fox_token.webp",
    senses: 0,
    attacks: [{ name: "Staff", formula: "1d6", nonlethal: true }],
    abilities: [
      ["Mid-Sentence", "The scholar believes the conversation from before the stasis is still happening. The first minute of contact is confusion, not combat. After that, the scholar decides whether the party are colleagues, thieves, or spies."],
      ["Workshop Spell", "Caster level 6. Prepared: comprehend languages, detect magic, identify, dispel magic, and one of lightning bolt, hold person, or glyph of warding. The scholar would rather call a guardian than fight."],
    ],
    room: "Desks throughout the historical wing. A cup, a page, and a sentence were all unfinished.",
    conduct: "Use one as a person, not a monster. Some will help. Some will demand the party leave. A few will try to finish an experiment that should have stayed frozen.",
  },
  {
    id: "CfGaDeathNotar10",
    name: "Deathless Notary",
    folder: "Undead",
    cr: 5,
    size: "med",
    type: "undead",
    align: "ln",
    hd: 7,
    die: 8,
    hp: 52,
    scores: { str: 16, dex: 12, con: null, int: 14, wis: 16, cha: 16 },
    natural: 6,
    speed: 20,
    dr: "5/—",
    portrait: "Servitor Mummy.webp",
    token: "Servitor Mummy Token.webp",
    senses: 60,
    attacks: [{ name: "Slam", formula: "1d8+3", nonlethal: false }],
    abilities: [
      ["Authentication", "The notary asks for a name, a privilege, and the title of the record being sought. A true answer, or a DC 20 Bluff or Diplomacy check, satisfies it. A failure does not start a fight by itself."],
      ["Holding Chamber", "Once per day, a creature who fails authentication and then refuses to leave must succeed at a DC 16 Will save or be teleported to a locked reading cell elsewhere in the wing. The save is Charisma-based."],
    ],
    room: "The doors of the sensitive collections.",
    conduct: "It was preserved on purpose to keep asking the same question. It is not lonely and it is not merciful about forged credentials.",
  },
  {
    id: "CfGaPrismJackl10",
    name: "Prism Jackal",
    folder: "Beasts",
    cr: 5,
    size: "med",
    type: "magical beast",
    align: "ln",
    hd: 6,
    die: 10,
    hp: 45,
    shield: 30,
    scores: { str: 16, dex: 17, con: 14, int: 6, wis: 14, cha: 8 },
    natural: 4,
    speed: 40,
    portrait: "Jackal.webp",
    token: "Jackal Token.webp",
    senses: 60,
    scent: true,
    attacks: [{ name: "Bite", formula: "1d6+3", nonlethal: false }],
    abilities: [
      ["Networked Aegis", "Each jackal wears a collar with a 30-point Mananite shield. Jackals within 30 feet of each other share one pool: damage to any of them comes off that pool first. Separate them by more than 30 feet and each collar becomes its own 30-point shield."],
      ["Collar Break", "A collar has hardness 8 and 10 hit points. Destroying it drops that jackal out of the network and removes its shield."],
    ],
    room: "The military research wing, usually in pairs or threes.",
    conduct: "They hunt as a pack and the shields are the trick. Splitting the pack is the fight.",
  },
  {
    id: "CfGaSarcoCroc010",
    name: "Sarcophagus Crocodile",
    folder: "Beasts",
    cr: 6,
    size: "lg",
    type: "magical beast",
    align: "n",
    hd: 8,
    die: 10,
    hp: 84,
    shield: 40,
    scores: { str: 22, dex: 12, con: 18, int: 2, wis: 12, cha: 6 },
    natural: 8,
    speed: 20,
    portrait: "Mummified Crocodile.webp",
    token: "Mummified Crocodile Token.webp",
    senses: 60,
    attacks: [
      { name: "Bite", formula: "1d8+6", nonlethal: false },
      { name: "Tail", formula: "1d12+3", nonlethal: false },
    ],
    abilities: [
      ["Preservation Tank", "The crocodile lives in a water-filled sarcophagus. In water it gains a +8 bonus to Stealth and can hold its breath indefinitely."],
      ["Discharge Organ", "Every 1d4 rounds, a creature that hits it with a metal weapon, or that it bites, takes 2d6 electricity. Its 40-point shield absorbs damage before this organ is exposed. While the shield remains, the organ does not fire."],
    ],
    room: "The preservation tanks beside the garden court.",
    conduct: "It was a guardian animal, not a pet. It strikes anything that enters the water.",
  },
  {
    id: "CfGaWhisperSrp10",
    name: "Whispering Serpent",
    folder: "Beasts",
    cr: 4,
    size: "med",
    type: "magical beast",
    align: "n",
    hd: 5,
    die: 10,
    hp: 32,
    scores: { str: 12, dex: 18, con: 12, int: 13, wis: 14, cha: 16 },
    natural: 2,
    speed: 20,
    portrait: "Moonglass Viper.webp",
    token: "Moonglass Viper Token.webp",
    senses: 30,
    attacks: [{ name: "Bite", formula: "1d4+1", nonlethal: false }],
    abilities: [
      ["Perfect Recital", "The serpent can repeat any conversation it has heard, word for word, including one from the minute before the stasis. It uses this to bargain."],
      ["Hypnotic Script", "As a standard action, a 15-foot cone of moving hieroglyphs. DC 15 Will or be fascinated for 1d4 rounds. The save is Charisma-based. A creature that is attacked gets a new save."],
    ],
    room: "Message shafts, lamp niches, and the gaps behind shelves.",
    conduct: "It was a spy. It will sell a secret for safe passage, and it will lie about the price.",
  },
  {
    id: "CfGaBibliophag10",
    name: "Bibliophage",
    folder: "Aberrations",
    cr: 7,
    size: "med",
    type: "aberration",
    align: "ne",
    hd: 8,
    die: 8,
    hp: 68,
    scores: { str: 14, dex: 14, con: 16, int: 16, wis: 14, cha: 12 },
    natural: 6,
    speed: 30,
    portrait: "Grick.webp",
    token: "Grick Token.webp",
    senses: 60,
    attacks: [{ name: "Bite", formula: "1d8+2", nonlethal: false }],
    abilities: [
      ["Eat the Knowing", "A bite that hits deals no extra damage. Instead the target must succeed at a DC 16 Will save or lose one prepared spell, or become unable to speak one language it knows, for 1 hour. The save is Intelligence-based. A second failure within the hour can suppress one trained skill."],
      ["Escaped Subject", "This thing was a research animal. Its pen is open because the keepers were frozen before they could close it. It is hungry for words, not meat, and it will pass by a silent creature to reach someone who is casting or reading aloud."],
    ],
    room: "The occult wing, and any corridor where a cage was left unlatched.",
    conduct: "It should feel like a mistake the archive was in the middle of correcting.",
  },
  {
    id: "CfGaStoryEater10",
    name: "The Story Eater",
    folder: "Aberrations",
    cr: 16,
    size: "huge",
    type: "aberration",
    align: "ne",
    hd: 20,
    die: 8,
    hp: 250,
    scores: { str: 24, dex: 14, con: 20, int: 22, wis: 18, cha: 20 },
    natural: 12,
    speed: 30,
    portrait: "Voidwraith.webp",
    token: "Voidwraith Token.webp",
    senses: 120,
    attacks: [{ name: "Erasure", formula: "4d6+7", nonlethal: false, types: ["negative energy"] }],
    abilities: [
      ["Containment", "The Story Eater is inside a layered Mananite prison, not wearing a shield. The prison has 200 hit points and regenerates 10 per round while its projectors stand. Breaking it is how the creature gets out. This is not an ordinary fight for a 3rd- to 7th-level party."],
      ["Consume the Record", "A creature that can see it and hears its name, or that fails a DC 25 Will save after being hit, forgets one fact: a person's name, a spell, or a stretch of the last hour. Documents that recorded that fact go blank. The archive keeps duplicate copies of some eaten histories in lead-lined drawers. Those duplicates are the proof that the forgotten thing was real."],
      ["Why the Stasis", "The scholars did not freeze the archive to save it from tomb robbers. Something had already left a cage. The sphinx's last order is to keep the rest of the cages shut, including this one."],
    ],
    room: "The Black Archive, behind the vault the colossus guards.",
    conduct: "Leave it contained. If the party frees it, the dungeon stops being a rescue of a frozen library and becomes a race to put it back.",
  },
];

const db = new ClassicLevel(pack, { keyEncoding: "utf8", valueEncoding: "json" });
await db.open();

let mummy = null;
for await (const [key, value] of db.iterator({ gte: "!actors!", lt: "!actors!~" })) {
  if (value?.name === "Golem, Mummy") mummy = value;
}
if (!mummy) throw new Error("Golem, Mummy was not in the pack; it is the structural template.");

let slam = null;
let constructClass = null;
for (const itemId of mummy.items || []) {
  const item = await db.get(`!actors.items!${mummy._id}.${itemId}`);
  if (item?.type === "attack" && /slam/i.test(item.name) && !slam) slam = item;
  if (item?.type === "class" && !constructClass) constructClass = item;
}
if (!slam || !constructClass) throw new Error("Missing the mummy slam or class to clone.");

const names = new Set(MONSTERS.map((monster) => monster.name));
const ids = new Set(MONSTERS.map((monster) => monster.id));
const remove = [];
for await (const [key, value] of db.iterator({ gte: "!actors!", lt: "!actors!~" })) {
  if (names.has(value?.name) || ids.has(value?._id)) remove.push(value._id);
}
for (const id of new Set(remove)) {
  await db.del(`!actors!${id}`);
  for (const prefix of [`!actors.items!${id}.`, `!actors.effects!${id}.`, `!actors.items.effects!${id}.`]) {
    const keys = [];
    for await (const [key] of db.iterator({ gte: prefix, lt: `${prefix}\uffff` })) keys.push(key);
    for (const key of keys) await db.del(key);
  }
}

let archiveId = ARCHIVE_ID;
for await (const [key, value] of db.iterator({ gte: "!folders!", lt: "!folders!~" })) {
  if (value?.type === "Actor" && value?.name === "Grand Archive" && !value?.folder) archiveId = value._id;
}

await db.put(`!folders!${archiveId}`, {
  name: "Grand Archive",
  sorting: "a",
  folder: null,
  type: "Actor",
  description: "The Grand Archive of Tekhpu and Nitaten.",
  sort: 250000,
  color: "#3ecbff",
  flags: {},
  _stats: stats(),
  _id: archiveId,
});

let folderSort = 200000;
for (const [name, id] of Object.entries(FOLDERS)) {
  if (id === "CfArchiveConstr1") continue;
  await db.put(`!folders!${id}`, {
    name,
    sorting: "a",
    folder: archiveId,
    type: "Actor",
    description: "",
    sort: folderSort,
    color: name === "Undead" ? "#6b5b7a" : name === "Plants" ? "#3d8f4a" : "#7ee7ff",
    flags: {},
    _stats: stats(),
    _id: id,
  });
  folderSort += 100000;
}

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
  item.flags = { core: {} };
  return item;
}

function modOf(score) {
  if (score == null) return 0;
  return Math.floor((score - 10) / 2);
}

function poorSave(hd) {
  return Math.floor(hd / 3);
}

function goodSave(hd) {
  return 2 + Math.floor(hd / 2);
}

function setCreatureType(actor, type) {
  const current = actor.system.traits.creatureTypes;
  if (Array.isArray(current)) actor.system.traits.creatureTypes = [type];
  else if (current && Array.isArray(current.value)) current.value = [type];
  else actor.system.traits.creatureTypes = [type];
}

function build(monster) {
  const docs = [];
  const add = (item) => {
    docs.push(item);
    return item;
  };

  const saves = {
    construct: { fort: "low", ref: "low", will: "low" },
    plant: { fort: "high", ref: "low", will: "low" },
    undead: { fort: "low", ref: "low", will: "high" },
    vermin: { fort: "high", ref: "low", will: "low" },
    "magical beast": { fort: "high", ref: "high", will: "low" },
    ooze: { fort: "high", ref: "low", will: "low" },
    aberration: { fort: "low", ref: "low", will: "high" },
    humanoid: { fort: "low", ref: "low", will: "high" },
    outsider: { fort: "high", ref: "high", will: "high" },
  }[monster.type] || { fort: "low", ref: "low", will: "low" };
  const classItem = blankItem(constructClass, CLASS_NAME[monster.type] || monster.type, "class");
  classItem.system.description = description(`<p>${monster.hd} Hit Dice. The listed ${monster.hp} hit points are stored on this class.</p>`);
  classItem.system.level = monster.hd;
  classItem.system.hd = monster.die;
  classItem.system.hp = monster.hp;
  classItem.system.bab = "high";
  classItem.system.skillsPerLevel = 2;
  classItem.system.savingThrows = {
    fort: { value: saves.fort },
    ref: { value: saves.ref },
    will: { value: saves.will },
  };
  classItem.system.changes = [];
  classItem.system.contextNotes = [];
  if (classItem.system.classSkills) {
    for (const key of Object.keys(classItem.system.classSkills)) classItem.system.classSkills[key] = false;
  }
  add(classItem);

  for (const attackDef of monster.attacks) {
    const item = blankItem(slam, attackDef.name, "attack");
    item.img = slam.img || "systems/pf1/icons/feats/improved-unarmed-strike.jpg";
    item.system.subType = "natural";
    item.system.nonlethal = !!attackDef.nonlethal;
    item.system.showInQuickbar = true;
    item.system.showInCombat = true;
    item.system.attackName = attackDef.name;
    item.system.description = description(attackDef.nonlethal
      ? "<p>Restrained archive force. This attack deals nonlethal damage.</p>"
      : "<p>This attack deals lethal damage.</p>");
    const attack = item.system.actions?.[0] || {
      _id: nid(),
      name: attackDef.name,
      img: "",
      activation: { cost: 1, type: "attack", unchained: { cost: 1, type: "action" } },
      duration: { units: "inst" },
      uses: {},
    };
    attack.name = attackDef.name;
    attack.actionType = "mwak";
    attack.range = { units: "melee" };
    attack.nonlethal = !!attackDef.nonlethal;
    attack.ability = { attack: monster.scores.str == null ? "dex" : "str", damage: "", damageMult: 1, critRange: 20, critMult: 2 };
    attack.damage = { parts: [{ formula: attackDef.formula, types: attackDef.types || ["bludgeoning"] }] };
    attack.naturalAttack = { primary: true, secondary: { attackBonus: "0", damageMult: 1 } };
    attack.notes = { effect: [attackDef.nonlethal ? "Nonlethal." : "Lethal."] };
    item.system.actions = [attack];
    add(item);
  }

  for (const [name, html] of monster.abilities) {
    const item = blankItem(constructClass, name, "feat");
    item.system.subType = "racial";
    item.system.description = description(`<p>${html}</p>`);
    item.system.changes = [];
    item.system.actions = [];
    item.system.showInQuickbar = false;
    add(item);
  }

  const actor = structuredClone(mummy);
  actor._id = monster.id;
  actor.name = monster.name;
  actor.img = portrait(monster.portrait);
  actor.folder = FOLDERS[monster.folder];
  actor.items = docs.map((item) => item._id);
  actor.effects = [];
  actor.ownership = { default: 0 };
  actor.sort = monster.cr * 1000;
  actor._stats = stats();
  actor.flags = { core: {}, pf1: { migration: "11.11" } };
  if (monster.shield) {
    actor.flags["critical-fail-pf1e-utilities"] = {
      energyShield: {
        enabled: true,
        max: monster.shield,
        value: monster.shield,
        regen: 0,
        bodyRegen: 0,
        dr: 0,
        suppressedUntil: null,
        hasteRounds: 0,
        regenSuppressed: false,
        coreRemoved: false,
        form: null,
        showOnSheet: true,
        tempFirst: false,
      },
    };
  }

  for (const [key, value] of Object.entries(monster.scores)) {
    actor.system.abilities[key] = { value, damage: 0, drain: 0, userPenalty: 0 };
  }
  actor.system.attributes.naturalAC = monster.natural;
  actor.system.attributes.quadruped = monster.name === "Index Hound";
  actor.system.attributes.init = { value: 0, ability: "dex" };
  actor.system.attributes.hp = { temp: 0, nonlethal: 0, offset: 0 };
  actor.system.attributes.speed.land.base = monster.speed;
  if (monster.fly) actor.system.attributes.speed.fly = { base: monster.fly, maneuverability: "perfect" };
  else if (actor.system.attributes.speed.fly) actor.system.attributes.speed.fly.base = 0;

  const dex = modOf(monster.scores.dex);
  const sizeAc = SIZE_AC[monster.size] || 0;
  const deflection = monster.deflection || 0;
  const ac = 10 + sizeAc + dex + monster.natural + deflection;
  const touch = 10 + sizeAc + dex + deflection;
  const flat = 10 + sizeAc + monster.natural;
  actor.system.attributes.acNotes = `Intended AC ${ac}, touch ${touch}, flat-footed ${flat}.`;

  actor.system.details.alignment = monster.align;
  actor.system.details.cr = { base: monster.cr };
  actor.system.details.xp = { value: XP[monster.cr] };
  actor.system.details.notes = { value: `${monster.room} Grand Archive of Tekhpu and Nitaten.` };
  actor.system.traits.size = monster.size;
  if (actor.system.traits.senses) {
    actor.system.traits.senses.dv = { value: monster.senses };
    if (monster.scent && actor.system.traits.senses.sc) actor.system.traits.senses.sc = { value: 30 };
  }
  actor.system.traits.dr = monster.dr
    ? { value: [], custom: monster.dr }
    : { value: [], custom: "" };
  actor.system.traits.eres = { value: [], custom: "" };
  actor.system.traits.di = monster.type === "construct" ? [] : monster.type === "undead" ? ["death effects", "disease", "paralysis", "poison", "sleep", "stunning"] : [];
  actor.system.traits.dv = [];
  actor.system.traits.ci = [TRAIT[monster.type] || monster.type];
  actor.system.traits.regen = monster.regen || "";
  actor.system.traits.fastHealing = monster.fastHealing || "";
  if (monster.incorporeal) actor.system.traits.ci.push("Incorporeal");
  setCreatureType(actor, monster.type);

  const saveBonus = (which) => (saves[which] === "high" ? goodSave(monster.hd) : poorSave(monster.hd));
  const fort = saveBonus("fort") + modOf(monster.scores.con);
  const ref = saveBonus("ref") + dex;
  const will = saveBonus("will") + modOf(monster.scores.wis);
  const attackAbility = monster.scores.str == null ? dex : modOf(monster.scores.str);
  const bab = monster.hd;
  const attack = bab + attackAbility + sizeAc;

  const attackLine = monster.attacks.map((entry) => `${entry.name} +${attack} (${entry.formula}${entry.nonlethal ? " nonlethal" : ""})`).join(" and ");
  actor.system.details.biography = {
    value: `<p><strong>${monster.name}</strong> — CR ${monster.cr}, XP ${XP[monster.cr].toLocaleString("en-US")}. ${monster.size} ${monster.type}. ${monster.room}</p>
<p><b>Defense:</b> AC ${ac}, touch ${touch}, flat-footed ${flat}. hp ${monster.hp}. ${monster.shield ? `Mananite shield ${monster.shield}. ` : ""}Fort +${fort}, Ref +${ref}, Will +${will}. ${monster.dr ? `DR ${monster.dr}. ` : ""}${monster.regen ? `Regeneration ${monster.regen}. ` : ""}${monster.fastHealing ? `Fast healing ${monster.fastHealing}. ` : ""}</p>
<p><b>Offense:</b> Speed ${monster.speed} ft.${monster.fly ? `, fly ${monster.fly} ft.` : ""} Melee ${attackLine}.</p>
<p><b>Conduct:</b> ${monster.conduct}</p>
<ul>${monster.abilities.map(([name, text]) => `<li><b>${name}.</b> ${text}</li>`).join("")}</ul>`,
  };

  const span = TOKEN_SIZE[monster.size] || 1;
  actor.prototypeToken = actor.prototypeToken || {};
  actor.prototypeToken.name = monster.name;
  actor.prototypeToken.width = span;
  actor.prototypeToken.height = span;
  actor.prototypeToken.disposition = monster.disposition ?? -1;
  actor.prototypeToken.displayBars = 20;
  actor.prototypeToken.bar1 = { attribute: "attributes.hp" };
  actor.prototypeToken.texture = {
    ...(actor.prototypeToken.texture || {}),
    src: portrait(monster.token),
    tint: "#ffffff",
    scaleX: 1,
    scaleY: 1,
  };
  actor.prototypeToken.sight = {
    ...(actor.prototypeToken.sight || {}),
    enabled: true,
    range: monster.senses,
    angle: 360,
    visionMode: "basic",
  };

  return { actor, docs };
}

for (const monster of MONSTERS) {
  const { actor, docs } = build(monster);
  await db.put(`!actors!${actor._id}`, actor);
  for (const item of docs) await db.put(`!actors.items!${actor._id}.${item._id}`, item);
  console.log(`${monster.name} CR ${monster.cr} → ${monster.folder}`);
}

await db.del("!folders!CfGaFoldConstr01");
await db.del("!folders!CfGaFoldHuman01");
await db.close();
console.log(`Added ${MONSTERS.length} Grand Archive creatures under ${archiveId}.`);
