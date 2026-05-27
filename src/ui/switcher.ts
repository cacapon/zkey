import { App, SuggestModal } from "obsidian";

export interface SuggestionItem {
  label: string;
  sub?: string;
  onChoose: () => void;
}

export class Switcher extends SuggestModal<SuggestionItem> {
  constructor(
    app: App,
    private items: SuggestionItem[],
    private dynamicItem?: (query: string, filtered: SuggestionItem[]) => SuggestionItem | null,
    placeholder?: string
  ) {
    super(app);
    this.limit = 1000;
    if (placeholder) this.setPlaceholder(placeholder);
  }

  getSuggestions(query: string): SuggestionItem[] {
    const filtered = this.items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    if (this.dynamicItem && query.trim()) {
      const extra = this.dynamicItem(query.trim(), filtered);
      if (extra) return [extra, ...filtered];
    }
    return filtered;
  }

  renderSuggestion(item: SuggestionItem, el: HTMLElement): void {
    el.createEl("div", { text: item.label });
    if (item.sub) {
      el.createEl("small", { text: item.sub });
    }
  }

  onChooseSuggestion(item: SuggestionItem): void {
    item.onChoose();
  }
}
