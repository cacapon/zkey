export interface Editor {
  openNote(path: string): Promise<void>;
  getSelection(): string | null;
  replaceSelection(text: string): void;
  getActiveFilePath(): string | null;
}
