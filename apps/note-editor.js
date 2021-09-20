export class NoteEditor extends FormApplication {
    constructor(...args) {
        super(...args);

        this.noteData = duplicate(getProperty(this.object.data, this.attribute) || "");
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "note-editor",
            classes: ["pf1alt", "entry"],
            title: "Notes Selector",
            template: "modules/pf1-alt-sheet/templates/apps/note-editor.html",
            width: 400,
            height: 400,
            closeOnSubmit: false,
            submitOnClose: false,
        });
    }

    get attribute() {
        return this.options.name;
    }

    getData() {
        return {noteData: this.noteData}
    }

    activateListeners(html) {
        html.find('button[type="submit"]').click(this._submitAndClose.bind(this));

        html.find('textarea').change(this._onEntryChange.bind(this));
    }

    async _onEntryChange(event) {
        const a = event.currentTarget;
        this.noteData = a.value;
    }

    async _updateObject(event, formData) {
        const updateData = {};

        updateData[this.attribute] = this.noteData;

        return this.object.update(updateData);
    }

    async _submitAndClose(event) {
        event.preventDefault();
        await this._onSubmit(event);
        this.close();
    }
}