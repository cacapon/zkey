import { TFile, TFolder, Vault } from "obsidian";
import { FileSystem } from "../core/fileSystem";

export class ObsidianFileSystem implements FileSystem {
  constructor(private vault: Vault) {}

  async createFolder(path: string): Promise<void> {
    await this.vault.createFolder(path);
  }

  async createFile(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return await this.vault.adapter.exists(path);
  }

  async readFile(path: string): Promise<string> {
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return await this.vault.read(file);
    }
    return "";
  }

  async writeFile(path: string, content: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.vault.modify(file, content);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(oldPath);
    if (file) {
      await this.vault.rename(file, newPath);
    }
  }

  listFiles(dirPath: string): string[] {
    const folder = this.vault.getAbstractFileByPath(dirPath);
    if (!(folder instanceof TFolder)) return [];
    return folder.children
      .filter((f) => f instanceof TFile)
      .map((f) => f.path);
  }
}
