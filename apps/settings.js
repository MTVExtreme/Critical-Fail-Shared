export class SettingsEditor extends FormApplication {
    constructor(...args) {
        super(...args);

        //this.noteData = duplicate(getProperty(this.object.data, this.attribute) || "");
        this.sheet = this.object;
        //console.log(this.object);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "settings-editor",
            classes: ["pf1alt", "entry"],
            title: game.i18n.localize("PF1.Settings"),
            template: "modules/pf1-alt-sheet/templates/apps/settings.hbs",
            width: 600,
            height: 600,
            closeOnSubmit: false,
            submitOnClose: false,
        });
    }

    get attribute() {
        return this.options.name;
    }

    getData() {
        return this.sheet.actorData;
    }

    activateListeners(html) {
        html.find('button[type="submit"]').click(this._submitAndClose.bind(this));

        //html.find('textarea').change(this._onEntryChange.bind(this));
    }

    async _onEntryChange(event) {
        const a = event.currentTarget;
        this.noteData = a.value;
    }

    async _updateObject(event, formData) {
        let updateData = {
            data: {
                attributes: {
                    spells: {
                        usedSpellbooks: []
                    },
                    hpAbility: this.sheet.actor.data.data.attributes.hpAbility,
                    cmbAbility: this.sheet.actor.data.data.attributes.cmbAbility,
                    init: {
                        ability: this.sheet.actor.data.data.attributes.init.ability,
                    },
                    attack: {
                        meleeAbility: this.sheet.actor.data.data.attributes.attack.meleeAbility,
                        rangedAbility: this.sheet.actor.data.data.attributes.attack.rangedAbility
                    },
                    woundThresholds: {
                        override: this.sheet.actor.data.data.attributes.woundThresholds.override
                    },
                    ac: {
                        normal: { ability: this.sheet.actor.data.data.attributes.ac.normal.ability },
                        touch: { ability: this.sheet.actor.data.data.attributes.ac.touch.ability }
                    },
                    cmd: {
                        dexAbility: this.sheet.actor.data.data.attributes.cmd.dexAbility,
                    },
                    savingThrows: {
                        fort: { ability: this.sheet.actor.data.data.attributes.savingThrows.fort.ability },
                        ref: { ability: this.sheet.actor.data.data.attributes.savingThrows.ref.ability },
                        will: { ability: this.sheet.actor.data.data.attributes.savingThrows.will.ability },
                    }
                },
                details: {
                    tooltip: {
                        name: this.sheet.actor.data.data.details.tooltip.name,
                        hideHeld: this.sheet.actor.data.data.details.tooltip.hideHeld,
                        hideArmor: this.sheet.actor.data.data.details.tooltip.hideArmor,
                        hideBuffs: this.sheet.actor.data.data.details.tooltip.hideBuffs,
                        hideConditions: this.sheet.actor.data.data.details.tooltip.hideConditions,
                        hideClothing: this.sheet.actor.data.data.details.tooltip.hideClothing,
                        hideName: this.sheet.actor.data.data.details.tooltip.hideName,
                    }
                }
            }
        };

        /*
        console.log(event);
        console.log(formData);
        */

        if (event.target.name === "reset-config")
        {
            // Delete altsheet config.
            this.sheet.resetModuleActorConfig();
        }

        const linkOptions = {
            mode: formData["altSheet.links.mode"]
        };
        this.sheet.setLinkOptions(linkOptions);

        //updateData[this.attribute] = this.noteData;
        for (let [sk, spellbook] of Object.entries(this.sheet.actor.data.data.attributes.spells.spellbooks))
        {
            //spellbook.inUse = false;
            if (formData["spellbook-" + sk + "-inuse"])
            {
                updateData.data.attributes.spells.usedSpellbooks.push(sk);
            }
        }

        updateData.data.attributes.hpAbility = formData.hpAbility;
        updateData.data.attributes.cmbAbility = formData.cmbAbility;
        updateData.data.attributes.init.ability = formData["data.attributes.init.ability"];
        updateData.data.attributes.attack.meleeAbility = formData.meleeAbility;
        updateData.data.attributes.attack.rangedAbility = formData.rangedAbility;
        updateData.data.attributes.woundThresholds.override = formData["data.attributes.woundThresholds.override"];
        updateData.data.attributes.ac.touch.ability = formData["data.attributes.ac.touch.ability"];
        updateData.data.attributes.ac.normal.ability = formData["data.attributes.ac.normal.ability"];
        updateData.data.attributes.cmd.dexAbility = formData["data.attributes.cmd.dexAbility"];
        updateData.data.attributes.savingThrows.fort.ability = formData["data.attributes.savingThrows.fort.ability"];
        updateData.data.attributes.savingThrows.ref.ability = formData["data.attributes.savingThrows.ref.ability"];
        updateData.data.attributes.savingThrows.will.ability = formData["data.attributes.savingThrows.will.ability"];
        updateData.data.details.tooltip.name = formData["data.details.tooltip.name"];
        updateData.data.details.tooltip.hideHeld = formData["data.details.tooltip.hideHeld"];
        updateData.data.details.tooltip.hideArmor = formData["data.details.tooltip.hideArmor"];
        updateData.data.details.tooltip.hideBuffs = formData["data.details.tooltip.hideBuffs"];
        updateData.data.details.tooltip.hideConditions = formData["data.details.tooltip.hideConditions"];
        updateData.data.details.tooltip.hideClothing = formData["data.details.tooltip.hideClothing"];
        updateData.data.details.tooltip.hideName = formData["data.details.tooltip.hideName"];

        return this.sheet.actor.update(updateData);
    }

    async _submitAndClose(event) {
        event.preventDefault();
        await this._onSubmit(event);
        this.close();
    }
}
