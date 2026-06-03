import { App, SuggestModal } from "obsidian";
import { Mode } from "../core/mode";
import { ConfirmModal } from "./confirmModal";
import { i18n } from "../i18n";

export class DeleteModeModal extends SuggestModal<Mode> {
  constructor(
    app: App,
    private modes: Mode[],
    private onDelete: (mode: Mode) => void
  ) {
    super(app);
  }

  getSuggestions(query: string): Mode[] {
    return this.modes.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(mode: Mode, el: HTMLElement): void {
    el.createEl("div", { text: mode.name });
    el.createEl("small", { text: mode.dirPath });
  }

  onChooseSuggestion(mode: Mode): void {
    new ConfirmModal(
      this.app,
      i18n.confirmDelete(mode.name),
      () => this.onDelete(mode)
    ).open();
  }
}
