import { SuggestModal, App } from "obsidian";
import { ModeDefinition } from "../core/zkSettings";

type ModeItem =
  | { type: "mode"; def: ModeDefinition }
  | { type: "create" };

export class ModeSuggestModal extends SuggestModal<ModeItem> {
  private modes: ModeDefinition[];
  private onSelect: (mode: ModeDefinition) => void;
  private onCreateNew?: () => void;

  constructor(
    app: App,
    modes: ModeDefinition[],
    onSelect: (mode: ModeDefinition) => void,
    onCreateNew?: () => void
  ) {
    super(app);
    this.modes = modes;
    this.onSelect = onSelect;
    this.onCreateNew = onCreateNew;
  }

  getSuggestions(query: string): ModeItem[] {
    const q = query.toLowerCase();
    const filtered: ModeItem[] = this.modes
      .filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      .map((def) => ({ type: "mode", def }));

    if (this.onCreateNew) {
      filtered.push({ type: "create" });
    }
    return filtered;
  }

  renderSuggestion(item: ModeItem, el: HTMLElement): void {
    if (item.type === "create") {
      el.createEl("div", { text: "+ 新規モードを追加" });
    } else {
      el.createEl("div", { text: item.def.name });
    }
  }

  onChooseSuggestion(item: ModeItem): void {
    if (item.type === "create") {
      this.onCreateNew?.();
    } else {
      this.onSelect(item.def);
    }
  }
}
