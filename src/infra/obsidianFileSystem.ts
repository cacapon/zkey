import { Vault } from "obsidian";
import { FileSystem } from "../core/fileSystem";

export class ObsidianFileSystem implements FileSystem {
  constructor(private vault: Vault) {}

  async createFolder(path: string): Promise<void> {
    await this.vault.createFolder(path);
  }

  async createFile(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }

  exists(path: string): boolean {
    return this.vault.getAbstractFileByPath(path) !== null;
  }
}
