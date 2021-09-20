export function registerHandlebarsHelpers()
{
    Handlebars.registerHelper("isMetric", () => {
        return game.settings.get("pf1", "units") === "metric";
    });

    Handlebars.registerHelper("abilityDamaged", (abl) => {
        return abl.damage > 0 || abl.drain > 0 || abl.penalty > 0;
    });

    Handlebars.registerHelper("toMetric", (ft) => {
        return (ft * 3.0) / 10.0;
    });

    Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper("concentration", (base, cl, abls, abl) => {
        let mod = abls[abl]?.mod;
        return base + cl + (mod === undefined ? 0 : mod);
    });

    Handlebars.registerHelper("replaceNewLines", (text) => {
        return text.replace(/\n/g, "<br />");
    });

    Handlebars.registerHelper("isPositive", (value) => {
        return value > 0;
    });

    Handlebars.registerHelper("hasBaseSpellSlots", (obj, level) => {
        if (obj === undefined)
            return false;
        return obj?.orig?.spells[`spell${level}`]?.base != null;
    });

    Handlebars.registerHelper("isMythicPath", (clazz) => {
        return clazz.data.classType === "mythic";
    });

    Handlebars.registerHelper("isNegative", (value) => {
        return value < 0;
    });

    Handlebars.registerHelper("skillAlwaysShown", skillAlwaysShown);

    Handlebars.registerHelper("subskillShownInSummary", (actor, skill, subskill) =>
    {
        return (actor.skillsets.all.skills[skill].subSkills[subskill].rank > 0 || skillAlwaysShown(actor, skill, subskill));
    });
}

export function skillAlwaysShown(actor, skill, subskill)
{
    if (!("altSheet") in actor)
    {
        console.log("critical-fail-shared | altSheet not present in actor, this should not happen");
        return false;
    }
    if (!("skills") in actor.altSheet)
    {
        console.log("critical-fail-shared | skills not present in actor.altSheet, this should not happen");
        return false;
    }
    if (!(skill in actor.altSheet.skills))
    {
        actor.altSheet.skills[skill] = {
            as: false
        };
    }
    if (subskill !== undefined)
    {
        if (!("subskills" in actor.altSheet.skills[skill]))
        {
            actor.altSheet.skills[skill].subskills = {};
        }
        if (!(subskill in actor.altSheet.skills[skill].subskills))
        {
            actor.altSheet.skills[skill].subskills[subskill] = { as: false };
        }
        return actor.altSheet.skills[skill].subskills[subskill].as;
    }
    return actor.altSheet.skills[skill].as;
}

export function registerWithAIP()
{
    let aip = game.modules.get("autocomplete-inline-properties");
    if (aip && aip.active)
    {
        const DATA_MODE = aip.API.CONST.DATA_MODE;
        const sheetFields = [
            {
                selector: `.tab[data-tab="attributes"] .attribute.nac input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="attributes"] .attribute.sr input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="feats"] .features-formula input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="skills"] .skill-rank-formula input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="spellbook"] .spellcasting-misc input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="spellbook"] .spellbook-info-box .formulas input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
            {
                selector: `.tab[data-tab="spellbook"] .spellbook-info-box .spell-slot-ability-bonus input[type="text"]`,
                showButton: true,
                allowHotkey: true,
                dataMode: DATA_MODE.ROLL_DATA,
            },
        ];
        const aipConfig = {
            packageName: "critical-fail-shared",
            sheetClasses: [
                {
                    name: "KnWDomainPFCharacter",
                    fieldConfigs: sheetFields,
                },
                {
                    name: "KnWDomainPFNPC",
                    fieldConfigs: sheetFields,
                },
                {
                    name: "KnWDomainPFCharacter",
                    fieldConfigs: sheetFields,
                },
                {
                    name: "AltActorSheetPFNPC",
                    fieldConfigs: sheetFields,
                }
            ]
        };
        aip.API.PACKAGE_CONFIG.push(aipConfig);
    }
}

export function registerSettings()
{
    game.settings.register("critical-fail-shared", "addAttackChatCardTemplate", {
        name: "PF1AS.Chat.addAttackChatCardTemplateN",
        hint: "PF1AS.Chat.addAttackChatCardTemplateH",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: (val) => {
            if (val === false) {
                game.settings.set("pf1", "attackChatCardTemplate", "systems/pf1/templates/chat/attack-roll.hbs");
            }
            window.location.reload();
        },
    });
}

export function getSkipActionPrompt() {
    return (
        (game.settings.get("pf1", "skipActionDialogs") && !game.keyboard.isDown("Shift")) ||
        (!game.settings.get("pf1", "skipActionDialogs") && game.keyboard.isDown("Shift"))
    );
}
