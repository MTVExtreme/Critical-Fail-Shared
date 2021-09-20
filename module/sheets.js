import { NoteEditor } from "../apps/note-editor.js";
import { SettingsEditor } from "../apps/settings.js";
import { skillAlwaysShown, getSkipActionPrompt } from "./helpers.js";

/*
In a "perfect" world, I would use a mixin here:
const AltSheetMixin = (BaseClass) => class extends BaseClass { ... };
class AltActorSheetPFCharacter extends AltSheetMixin(ActorSheetPFCharacter) {};
class AltActorSheetPFNPC extends AltSheetMixin(ActorSheetPFNPC) {};

That way, we would have no code duplication here.
And no Object.assign();
However, this breaks event bubbling to the base classes BUT ONLY IN BROWSERS!
Desktop electron foundry is fine.

Revisit this in a year or whenever.
*/

export class KnWUnitPFCharacter extends game.pf1.applications.ActorSheetPFCharacter {
    get template() {
        // TODO: change this to our own lite sheet
        if (!game.user.isGM && this.actor.limited) return "systems/pf1/templates/actors/limited-sheet.hbs";
        return "modules/critical-fail-shared/templates/unitsheet.hbs";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["pf1knw", "sheet", "actor", "character"],
            width: 820,
            height: 840,
            scrollY: [
                ".buffs-body",
                ".feats-body",
                ".spells_primary-body",
                ".spells_secondary-body",
                ".spells_tertiary-body",
                ".spells_spelllike-body",
                ".skills-list.adventure",
                ".skills-list.background",
                ".combat-attacks",
                ".inventory-body",
                ".attributes-body"
            ]
        });
    }

    get currentPrimaryTab() {
        const primaryElem = this.element.find('nav[data-group="primary-altsheet"] .item.active');
        if (primaryElem.length !== 1) return null;
        return primaryElem.attr("data-tab");
    }

    async getData() {
        return this.mixinGetData(await super.getData());
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.mixinActivateListeners(html);
    }
};

// Yes, code duplication. Because JS.
export class KnWUnitPFNPC extends game.pf1.applications.ActorSheetPFNPC {
    get template() {
        // TODO: change this to our own lite sheet
        if (!game.user.isGM && this.actor.limited) return "systems/pf1/templates/actors/limited-sheet.hbs";
        return "modules/critical-fail-shared/templates/unitsheet.hbs";
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["pf1knw", "sheet", "actor", "character"],
            width: 820,
            height: 840,
            scrollY: [
                ".buffs-body",
                ".feats-body",
                ".spells_primary-body",
                ".spells_secondary-body",
                ".spells_tertiary-body",
                ".spells_spelllike-body",
                ".skills-list.adventure",
                ".skills-list.background",
                ".combat-attacks",
                ".inventory-body",
                ".attributes-body"
            ]
        });
    }

    get currentPrimaryTab() {
        const primaryElem = this.element.find('nav[data-group="primary-altsheet"] .item.active');
        if (primaryElem.length !== 1) return null;
        return primaryElem.attr("data-tab");
    }

    async getData() {
        return await this.mixinGetData(await super.getData());
    }

    activateListeners(html) {
        super.activateListeners(html);
        this.mixinActivateListeners(html);
    }
};

// Define shared functions here.
// DO NOT USE super, IT DOES NOT WORK AND I CAN'T USE A MIXIN CLASS BECAUSE REASONS!
export const AltSheetMixin = {
    defaultConfig()
    {
        return {
            skills: {
            },
            features: {
                minimizeClasses: false,
            },
            links: {
                mode: "none",
            }
        }
    },

    getModuleActorConfig()
    {
        // Check if there is a config for this actor
        let config = this.actor.getFlag("critical-fail-shared", "config");
        if (config === undefined)
        {
            config = this.defaultConfig();
        }
        return config;
    },

    resetModuleActorConfig()
    {
        console.log("critical-fail-shared | Resetting actor config");
        this.actor.unsetFlag("critical-fail-shared", "config");
    },

    setModuleActorConfig(update)
    {
        const data = mergeObject(this.getModuleActorConfig(), update, { inplace: false });
        this.actor.setFlag("critical-fail-shared", "config", data);
    },

    setLinkOptions(options)
    {
        this.setModuleActorConfig({
            links: {
                mode: options.mode
            }
        });
    },

    async mixinGetData(data) {
        let classesHidden = !data.filters.features.has("type-classes");
        if (data.filters.features.size == 0)
        {
            classesHidden = false;
        }

        let al =  game.modules.get("koboldworks-pf1-actor-link");
        const actorLinkEnabled = al && al.active;

        // inject some stuff for our sheet
        data = mergeObject(data, {
            attacks: {
                weapon: {
                    canBreak: true,
                },
            },
            data: {
                abilities: {
                    str: { labelShort: 'ATK', label: 'Attack' },
                    dex: { labelShort: 'DEF', label: 'Defense'},
                    con: { labelShort: 'POW', label: 'Power' },
                    int: { labelShort: 'TOU', label: 'Toughness' },
                    wis: { labelShort: 'MOR', label: 'Morale' },
                    cha: { labelShort: 'COM', label: 'Command' },
                },
                attributes: {
                    ac: {
                        normal: { labelShort: game.i18n.localize("PF1AS.ACShort") },
                        touch: { labelShort: game.i18n.localize("PF1AS.TouchShort") },
                        flatFooted: { labelShort: game.i18n.localize("PF1AS.FFShort") }
                    },
                    naturalACtotal: (data.data.attributes.ac.flatFooted.total - (data.data.attributes.ac.touch.total - data.data.abilities.dex.mod)) // FIXME: this is so wrong
                }
            },
            skillsets: {
                known: { skills: {} }
            },
            inventory: {
                weapon: { canBreak: true },
                equipment: { canBreak: true },
            },
            config: {
                conditionCompendiumEntries: {
                    bleed: "pf1.conditions.93aTFy7v8VUq8sNi",
                    pf1_blind: "pf1.conditions.coxrkb6qUKBZvVxP",
                    confused: "pf1.conditions.VbG9W9dMz2jhgfCi",
                    dazed: "pf1.conditions.woFU0s24URgixLm7",
                    dazzled: "pf1.conditions.2pICNUG3g7O4obyu",
                    pf1_deaf: "pf1.conditions.ZTA39rR8AnZcydiu",
                    entangled: "pf1.conditions.WH3Hop5fUDUzVUVg",
                    fatigued: "pf1.conditions.nku8mgRBNt0iXqzB",
                    frightened: "pf1.conditions.QdwliEzfA3ZK9YtS",
                    exhausted: "pf1.conditions.I1cKXhfBaFIrL9Ix",
                    grappled: "pf1.conditions.zemoWcP2SR6FTiS1",
                    helpless: "pf1.conditions.g84rPrlfDnkUopAa",
                    incorporeal: "pf1.conditions.75ojKVcFLHBi80J9",
                    invisible: "pf1.conditions.L3hNCX9kLGlmoQhc",
                    nauseated: "pf1.conditions.1fkE2juoZHXjU90M",
                    panicked: "pf1.conditions.xhQma4Gl4wLO0jnZ",
                    paralyzed: "pf1.conditions.8zG4yDD2zGVSAJFH",
                    pinned: "pf1.conditions.uxkaA2RC6METVN6w",
                    pf1_prone: "pf1.conditions.Av5KcblR1Wd68uWY",
                    fear: "pf1.conditions.07JPXUqIPshVnTCL",
                    shaken: "pf1.conditions.07JPXUqIPshVnTCL",
                    sickened: "pf1.conditions.0AJZKIpP3lS3FVKa",
                    staggered: "pf1.conditions.6LpiJdKskDFD4zLC",
                    stunned: "pf1.conditions.assqfdN6G1URo9MZ"
                }
            },
            altSheet: this.getModuleActorConfig(),
            actorLinkEnabled: actorLinkEnabled,
        }, { inplace: false });

        // add hpMax to each class
        for (let clazz of data.classes)
        {
            clazz.data.hpMax = clazz.data.hd * clazz.data.level;
        }

        // Inject classes so that the filters include classes for the features
        data.features = {
            classes: {
                label: game.i18n.localize("PF1.Classes"),
                items: data.classes,
                isClass: true,
                canCreate: data.features.feat.canCreate,
                hasActions: false,
                dataset: { type: "class", "feat-type": "class"},
                _hidden: classesHidden,
            },
            ...data.features
        };

        // build the "known skill" list for the first page of the sheet, taken from 3.5e
        let skillkeys = Object.keys(data.skillsets.all.skills).sort(function(a,b) {
            if (data.skillsets.all.skills[a].custom && !data.skillsets.all.skills[b].custom) return 1;
            if (!data.skillsets.all.skills[a].custom && data.skillsets.all.skills[b].custom) return -1;
            return ('' + data.skillsets.all.skills[a].label).localeCompare(data.skillsets.all.skills[b].label)
        });
        skillkeys.forEach( a => {
            let skl = data.skillsets.all.skills[a]
            if (skl.rank > 0 || skillAlwaysShown(data, a, undefined))
            {
                data.skillsets.known.skills[a] = skl;
            }
            else if (skl.subSkills !== undefined)
            {
                data.skillsets.known.skills[a] = skl;
            }
        })

        // actor link familiar mode for skills
        if (actorLinkEnabled)
        {
            data = await this.doActorLinkStuff(data);
        }

        // add some things to the spellbooks
        const books = ["primary", "secondary", "tertiary", "spelllike"];
        for (const book of books)
        {
            if (data.spellbookData[book].orig.inUse)
            {
                const abl = data.spellbookData[book].orig.ability;
                const levels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                for (const [level, _] of Object.entries(data.spellbookData[book].data))
                {
                    // We fake the ablScore to 9 if none is set so that all levels can be casted.
                    const ablScore = abl === "" ? 9 : data.data.abilities[abl].total - 10;
                    const spellLevel = data.spellbookData[book].data[level].level;
                    const cannotCastAblScore =  !(spellLevel <= ablScore);
                    data.spellbookData[book].data[level].canCast = {
                        value: !cannotCastAblScore,
                        cannotCastAblScore: cannotCastAblScore,
                    };
                }
            }
        }

        //console.log(data);

        this.actorData = data;

        return data;
    },

    async doActorLinkStuff(data)
    {
        // Check if this actor is linked to another
        let linked = data.data._linked;
        if (!linked)
        {
            return data;
        }
        let modSkillsets = {
            skillsets: {
                all: {
                    skills: {}
                }
            }
        }
        // Check if mode is familiar
        if (data.altSheet.links.mode === "familiar")
        {
            // Inject master ranks into skills
            for (let [name, skill] of Object.entries(data.skillsets.all.skills))
            {
                modSkillsets.skillsets.all.skills[name] = {};
                modSkillsets.skillsets.all.skills[name].masterRank = linked.skills[name].rank;
                let clb = ((skill.rank ?? 0) == 0 && linked.skills[name].rank > 0 && skill.cs) ? 3 : 0;
                modSkillsets.skillsets.all.skills[name].masterMod = skill.mod - (skill.rank ?? 0) + (linked.skills[name].rank ?? 0) + clb;
                if (!(data.skillsets.all.skills[name].subSkills))
                {
                    continue;
                }
                for (let [subName, subSkill] of Object.entries(data.skillsets.all.skills[name].subSkills))
                {
                    if (subName in linked.skills[name].subSkills)
                    {
                        if (!('subSkills' in modSkillsets.skillsets.all.skills[name]))
                        {
                            modSkillsets.skillsets.all.skills[name].subSkills = {};
                        }
                        modSkillsets.skillsets.all.skills[name].subSkills[subName] = {};
                        modSkillsets.skillsets.all.skills[name].subSkills[subName].masterRank = linked.skills[name].subSkills[subName].rank;
                        clb = ((subSkill.rank ?? 0) == 0 && linked.skills[name].subSkills[subName].rank > 0 && skill.cs) ? 3 : 0
                        modSkillsets.skillsets.all.skills[name].subSkills[subName].masterMod = subSkill.mod - (subSkill.rank ?? 0) + (linked.skills[name].subSkills[subName].rank ?? 0) + clb;
                    }
                }
            }
            data = mergeObject(data, modSkillsets);
        }

        return data;
    },

    changesMod(sourceArr){
        let total = 0;
        sourceArr.forEach(c => {
            total += c.value;
        });
        return total;
    },

    mixinActivateListeners(html) {
        html.find(".note-editor").click(this._onNoteEditor.bind(this));

        html.find(".settings-button").click(this._onSettings.bind(this));

        html.find(".spell-slots-per-level span.text-box").on("click", (event) => {
            this._onSpanTextInput(event, this._onSubmit.bind(this));
        });

        html.find(".item .item-name .class-item-name").contextmenu(this._onItemEdit.bind(this));

        html.find(".skill > .skill-mod-total > .rollable").click(this._onRollSkillCheck.bind(this));
        html.find(".sub-skill > .skill-mod-total > .rollable").click(this._onRollSubSkillCheck.bind(this));

        html.find(".skill > .skill-master-mod-total > .rollable").click(this._onRollMasterSkillCheck.bind(this));
        html.find(".sub-skill > .skill-master-mod-total > .rollable").click(this._onRollMasterSubSkillCheck.bind(this));

        html.find(".altsheet-skill-checkbox").click(this._onAltSheetCheckbox.bind(this));
        html.find(".altsheet-minimize-classes-checkbox").click(this._onAltSheetCheckbox.bind(this));
    },

    _onAltSheetCheckbox(event) {
        event.preventDefault();
        event.stopPropagation();
        const path = event.target.attributes["data-altsheet-config-path"].value;
        const currentValue = getProperty(this.getModuleActorConfig(), path);
        let newData = {};
        setProperty(newData, path, !currentValue);
        this.setModuleActorConfig(newData);
    },

    _onNoteEditor(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const options = {
            name: a.getAttribute("for"),
            title: a.getAttribute("title"),
            fields: a.dataset.fields,
            dtypes: a.dataset.dtypes,
        };
        new NoteEditor(this.actor, options).render(true);
    },

    _onSettings(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const options = {
            name: "settings",
            title: game.i18n.localize("PF1.Settings"),
            fields: a.dataset.fields,
            dtypes: a.dataset.dtypes,
        };
        new SettingsEditor(this, options).render(true);
    },

    _onRollMasterSkillCheck(event) {
        event.preventDefault();
        const skill = event.currentTarget.parentElement.parentElement.dataset.skill;
        let originalRanks = this.document.data.data.skills[skill].rank;
        this.document.data.data.skills[skill].rank = this.document.data.data._linked.skills[skill].rank;
        this.document.rollSkill(skill, { event: event, skipDialog: getSkipActionPrompt() });
        this.document.data.data.skills[skill].rank = originalRanks;
    },

    _onRollMasterSubSkillCheck(event) {
        event.preventDefault();
        const mainSkill = event.currentTarget.parentElement.parentElement.dataset.mainSkill;
        const skill = event.currentTarget.parentElement.parentElement.dataset.skill;
        let originalRanks = this.document.data.data.skills[mainSkill].subSkills[skill].rank;
        this.document.data.data.skills[mainSkill].subSkills[skill].rank = this.document.data.data._linked.skills[mainSkill].subSkills[skill].rank;
        this.rollSkill(`${mainSkill}.subSkills.${skill}`, { event: event, skipDialog: getSkipActionPrompt() });
        this.document.data.data.skills[mainSkill].subSkills[skill].rank = originalRanks;
    },

    createTabs(html) {
        const tabGroups = {
          "primary-altsheet": {
            "inventory": {},
            "feats": {},
            "skillset": {},
            "buffs": {},
            "attacks": {},
            "spellbooks": {},
          },
        };
        // Add spellbooks to tabGroups
        for (let a of Object.keys(this.actor.data.data.attributes.spells.spellbooks)) {
          tabGroups["primary-altsheet"]["spellbooks"][`spells_${a}`] = {};
        }
        this._tabsAlt = createTabs.call(this, html, tabGroups, this._tabsAlt);
    },
}

// Copied from PF1
const createTabs = function (html, tabGroups, existingTabs = null) {
    // Create recursive activation/callback function
    const _recursiveActivate = function (rtabs, tabName = null) {
        if (rtabs.__dormant) return;

        if (tabName == null) this._initialTab[rtabs.group] = rtabs.active;
        else {
        rtabs.activate(tabName);
        this._initialTab[rtabs.group] = tabName;
        }

        // Recursively activate tabs
        for (let subTab of rtabs.subTabs) {
        _recursiveActivate.call(this, subTab, subTab.active);
        }
    };

    // Recursively bind tabs
    const _recursiveBind = function (rtabs) {
        rtabs.bind(html[0]);

        if (html.find(`nav[data-group="${rtabs.group}"]`).length > 0) rtabs.__dormant = false;
        else rtabs.__dormant = true;

        for (let subTab of rtabs.subTabs) {
        _recursiveBind.call(this, subTab);
        }
    };

    // Create all tabs
    const _func = function (group, children, tabs = null) {
        let dormant = false;
        if (html.find(`nav[data-group="${group}"]`).length === 0) dormant = true;

        if (this._initialTab == null) this._initialTab = {};

        const subHtml = html.find(`.${group}-body > div[data-group="${group}"]`);
        const activeSubHtml = subHtml.filter(".active");
        const initial =
        this._initialTab[group] !== undefined
            ? this._initialTab[group]
            : activeSubHtml.length > 0
            ? activeSubHtml[0].dataset.tab
            : "";

        // Set up data for scroll position and active tab
        if (this._initialTab[group] === undefined) this._initialTab[group] = initial;

        // Determine tab type
        const tabsElem = html.find(`.tabs[data-group="${group}"]`)[0];
        let cls = TabsV2;
        if (tabsElem) {
        let type = tabsElem.dataset.tabsType;
        if (type === "list") {
            cls = ListTabs;
        }
        }

        // Create tabs object
        if (!tabs) {
        tabs = new cls({
            navSelector: `.tabs[data-group="${group}"]`,
            contentSelector: `.${group}-body`,
            callback: (_, tabs) => {
            _recursiveActivate.call(this, tabs);
            },
        });
        tabs.__dormant = dormant;

        // Recursively create tabs
        tabs.group = group;
        tabs.subTabs = [];
        for (let [childKey, subChildren] of Object.entries(children)) {
            const childTabs = _func.call(this, childKey, subChildren);
            if (childTabs != null) {
            tabs.subTabs.push(childTabs);
            childTabs.parent = tabs;
            }
        }
        }

        _recursiveBind.call(this, tabs);
        return tabs;
    };

    for (const groupKey of Object.keys(tabGroups)) {
        return _func.call(this, groupKey, tabGroups[groupKey], existingTabs);
    }
};
