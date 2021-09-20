import { registerHandlebarsHelpers, registerWithAIP, registerSettings } from "./module/helpers.js";
import { addChatHooks } from "./module/chat.js"

Hooks.once("init", () => {
    registerSettings();

    const templates = [
        "modules/critical-fail-shared/templates/domainsheet.hbs",
        "modules/critical-fail-shared/templates/unitsheet.hbs",
        "modules/critical-fail-shared/templates/parts/actor-details.hbs",
        "modules/critical-fail-shared/templates/parts/actor-attributes.hbs",
        "modules/critical-fail-shared/templates/parts/actor-attacks.hbs",
        "modules/critical-fail-shared/templates/parts/actor-buffs.hbs",
        "modules/critical-fail-shared/templates/parts/actor-features.hbs",
        "modules/critical-fail-shared/templates/parts/actor-inventory.hbs",
        "modules/critical-fail-shared/templates/parts/actor-skills-front.hbs",
        "modules/critical-fail-shared/templates/parts/actor-skills.hbs",
        "modules/critical-fail-shared/templates/parts/actor-spellbook-front.hbs",
        "modules/critical-fail-shared/templates/parts/actor-spellbook.hbs"
    ];
    loadTemplates(templates);

    registerHandlebarsHelpers();

    registerWithAIP();


    if (game.settings.get("critical-fail-shared", "addAttackChatCardTemplate") === true) {
        addChatHooks();
    }

    console.log("critical-fail-shared | loaded");
});

Hooks.on("ready", async() => {
    if(!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
        ui.notifications.error("Module critical-fail-shared requires the 'libWrapper' module. Please install and activate it.");
        return;
    }

    const AltSheetMixin = (await import("./module/sheets.js")).AltSheetMixin;

    //const KnWDomainPFCharacter = (await import("./module/sheets.js")).KnWDomainPFCharacter;
    //Object.assign(KnWDomainPFCharacter.prototype, AltSheetMixin);
    //Actors.registerSheet("pf1domain", KnWDomainPFCharacter, {
    //    label: "Domain Sheet",
    //    types: ["character"],
    //    makeDefault: false
    //});

    //const KnWDomainPFNPC = (await import("./module/sheets.js")).KnWDomainPFNPC;
    //Object.assign(KnWDomainPFNPC.prototype, AltSheetMixin);
    //Actors.registerSheet("pf1domain", KnWDomainPFNPC, {
    //    label: "Domain Sheet",
    //    types: ["npc"],
    //    makeDefault: false
    //});

    const KnWUnitPFCharacter = (await import("./module/sheets.js")).KnWUnitPFCharacter;
    Object.assign(KnWUnitPFCharacter.prototype, AltSheetMixin);
    Actors.registerSheet("pf1domain", KnWUnitPFCharacter, {
        label: "Unit Sheet",
        types: ["character"],
        makeDefault: false
    });

    const KnWUnitPFNPC = (await import("./module/sheets.js")).KnWUnitPFNPC;
    Object.assign(KnWUnitPFNPC.prototype, AltSheetMixin);
    Actors.registerSheet("pf1domain", KnWUnitPFNPC, {
        label: "Unit Sheet",
        types: ["npc"],
        makeDefault: false
    });

    EntitySheetConfig.updateDefaultSheets(game.settings.get("core", "sheetClasses"));

    console.log("critical-fail-shared | sheets registered");
});
