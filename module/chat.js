

export function addChatHooks() {
    game.settings.register("pf1", "attackChatCardTemplate", {
        name: "SETTINGS.pf1AttackChatCardTemplateN",
        hint: "SETTINGS.pf1AttackChatCardTemplateH",
        scope: "world",
        config: true,
        default: "systems/pf1/templates/chat/attack-roll.hbs",
        type: String,
        choices: {
            "systems/pf1/templates/chat/attack-roll.hbs": "PF1.Primary",
            "systems/pf1/templates/chat/attack-roll2.hbs": "PF1.Alternate",
            "modules/critical-fail-shared/templates/chat/attack-roll.hbs": "PF1AS.Chat.AttackChatCard",
        },
    });

    libWrapper.register('critical-fail-shared', 'game.pf1.chat.ChatAttack.prototype.addDamage', addDamageWrapper, 'WRAPPER');
    libWrapper.register('critical-fail-shared', 'game.pf1.chat.ChatAttack.prototype.addAttack', addAttackWrapper, 'WRAPPER');
}

async function addAttackWrapper(fnext, options = {}) {
    await fnext(options);

    let data = this.attack;
    let roll = data.roll;
    let d20 = roll.dice.length ? roll.dice[0].total : roll.terms[0].total;
    this.attack.nat20 = d20 === 20;

    console.log(this.attack);
}

async function addDamageWrapper(fnext, options = {}) {
    await fnext(options);

    // Do not modify if our template is not choosen
    if (game.settings.get("pf1", "attackChatCardTemplate") !== "modules/critical-fail-shared/templates/chat/attack-roll.hbs")
    {
        return;
    }

    let data = this.damage;
    if (options.critical === true) data = this.critDamage;

    // Determine total damage
    let totalDamage = data.parts.reduce((cur, p) => {
        return cur + p.amount;
    }, 0);
    if (options.critical) {
        totalDamage = this.damage.parts.reduce((cur, p) => {
            return cur + p.amount;
        }, totalDamage);
    }

    // Handle minimum damage rule
    let minimumDamage = false;
    if (totalDamage < 1) {
        totalDamage = 1;
        minimumDamage = true;
        flavor = game.i18n.localize("PF1.Nonlethal");
    }

    // New cards
    if (options.critical)
    {
        this.cards.critical.items = []
        if (this.item.isHealing) {
            this.cards.critical.items.push({
                label: "0.5x",
                value: -Math.floor(totalDamage / 2),
                action: "applyDamage",
            });
            this.cards.critical.items.push({
                label: "1x",
                value: -totalDamage,
                action: "applyDamage",
            });
            this.cards.critical.items.push({
                label: "1.5x",
                value: -Math.floor(totalDamage * 1.5),
                action: "applyDamage",
            });
        } else {
            this.cards.critical.items.push({
                label: "0.5x",
                value: Math.floor(totalDamage / 2),
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
            this.cards.critical.items.push({
                label: "1x",
                value: totalDamage,
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
            this.cards.critical.items.push({
                label: "1.5x",
                value: Math.floor(totalDamage * 1.5),
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
        }
    } else {
        this.cards.damage.items = []
        if (this.item.isHealing) {
            this.cards.damage.items.push({
                label: "0.5x",
                value: -Math.floor(totalDamage / 2),
                action: "applyDamage",
            });
            this.cards.damage.items.push({
                label: "1x",
                value: -totalDamage,
                action: "applyDamage",
            });
            this.cards.damage.items.push({
                label: "1.5x",
                value: -Math.floor(totalDamage * 1.5),
                action: "applyDamage",
            });
        } else {
            this.cards.damage.items.push({
                label: "0.5x",
                value: Math.floor(totalDamage / 2),
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
            this.cards.damage.items.push({
                label: "1x",
                value: totalDamage,
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
            this.cards.damage.items.push({
                label: "1.5x",
                value: Math.floor(totalDamage * 1.5),
                action: "applyDamage",
                tags: minimumDamage ? "nonlethal" : "",
            });
        }
    }
}
