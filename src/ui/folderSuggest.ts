import { AbstractInputSuggest, App } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<string> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): string[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getAllFolders(false)
      .map((f) => f.path)
      .filter((p) => p.toLowerCase().includes(q))
      .slice(0, 20);
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value);
  }

  selectSuggestion(value: string): void {
    this.setValue(value);
    this.close();
  }
}
