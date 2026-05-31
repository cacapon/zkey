import { App, SuggestModal, getIconIds, setIcon } from "obsidian";

export class IconPickerModal extends SuggestModal<string> {
  constructor(app: App, private onChoose: (iconId: string) => void) {
    super(app);
  }

  getSuggestions(query: string): string[] {
    const q = query.toLowerCase();
    const matches = getIconIds().filter((id) => id.includes(q));
    return q ? matches : ["(なし)", ...matches];
  }

  renderSuggestion(iconId: string, el: HTMLElement): void {
    const row = el.createDiv({ cls: "zkey-icon-suggestion" });
    if (iconId === "(なし)") {
      row.createSpan({ text: "(なし)" });
    } else {
      const iconEl = row.createSpan();
      setIcon(iconEl, iconId);
      row.createSpan({ text: iconId });
    }
  }

  onChooseSuggestion(iconId: string): void {
    this.onChoose(iconId === "(なし)" ? "" : iconId);
  }
}
