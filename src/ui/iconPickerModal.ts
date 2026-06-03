import { App, SuggestModal, getIconIds, setIcon } from "obsidian";
import { i18n } from "../i18n";

export class IconPickerModal extends SuggestModal<string> {
  constructor(app: App, private onChoose: (iconId: string) => void) {
    super(app);
  }

  getSuggestions(query: string): string[] {
    const q = query.toLowerCase();
    const matches = getIconIds().filter((id) => id.includes(q));
    return q ? matches : [i18n.noIcon, ...matches];
  }

  renderSuggestion(iconId: string, el: HTMLElement): void {
    const row = el.createDiv({ cls: "zkey-icon-suggestion" });
    if (iconId === i18n.noIcon) {
      row.createSpan({ text: i18n.noIcon });
    } else {
      const iconEl = row.createSpan();
      setIcon(iconEl, iconId);
      row.createSpan({ text: iconId });
    }
  }

  onChooseSuggestion(iconId: string): void {
    this.onChoose(iconId === i18n.noIcon ? "" : iconId);
  }
}
