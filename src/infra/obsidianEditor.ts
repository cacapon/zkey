import { Workspace } from "obsidian";
import { Editor } from "../core/editor";

export class ObsidianEditor implements Editor {
  constructor(private workspace: Workspace) {}

  async openNote(path: string): Promise<void> {
    await this.workspace.openLinkText(path, "", false);
  }

  getSelection(): string | null {
    const selection = this.workspace.activeEditor?.editor?.getSelection();
    return selection || null;
  }

  replaceSelection(text: string): void {
    this.workspace.activeEditor?.editor?.replaceSelection(text);
  }
}
