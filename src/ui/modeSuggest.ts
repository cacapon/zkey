import { SuggestModal, App } from "obsidian";
import { Mode } from "../core/mode";

interface ModeItem {
  mode: Mode;
  label: string;
}

const MODE_ITEMS: ModeItem[] = [
  { mode: "Core", label: "CORE" },
  { mode: "Temp", label: "TMP" },
  { mode: "Ref",  label: "REF" },
];

export class ModeSuggestModal extends SuggestModal<ModeItem> {
  private onSelect: (mode: Mode) => void;

  constructor(app: App, onSelect: (mode: Mode) => void) {
    super(app);
    this.onSelect = onSelect;
  }

  getSuggestions(): ModeItem[] {
    return MODE_ITEMS;
  }

  renderSuggestion(item: ModeItem, el: HTMLElement): void {
    el.createEl("div", { text: item.label });
  }

  onChooseSuggestion(item: ModeItem): void {
    this.onSelect(item.mode);
  }
}
