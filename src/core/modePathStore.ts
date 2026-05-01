import { ModeDefinition } from "./zkSettings";

export class ModePathStore {
  private paths: Map<string, string> = new Map();
  private activeModeId: string | null = null;
  private modes: ModeDefinition[];
  private onModeChange?: (mode: ModeDefinition | null) => void;

  constructor(modes: ModeDefinition[]) {
    this.modes = modes;
    for (const mode of modes) {
      const folderName = mode.folder.split("/").pop() ?? mode.folder;
      this.paths.set(mode.id, `${mode.folder}/${folderName}.md`);
    }
  }

  getPath(modeId: string): string {
    return this.paths.get(modeId) ?? "";
  }

  setPath(modeId: string, path: string): void {
    this.paths.set(modeId, path);
  }

  getActiveMode(): ModeDefinition | null {
    if (!this.activeModeId) return null;
    return this.modes.find((m) => m.id === this.activeModeId) ?? null;
  }

  setActiveMode(mode: ModeDefinition): void {
    this.activeModeId = mode.id;
    this.onModeChange?.(mode);
  }

  onActiveModeChange(callback: (mode: ModeDefinition | null) => void): void {
    this.onModeChange = callback;
  }

  // モード一覧が変わったとき（追加・削除後）に呼ぶ
  updateModes(modes: ModeDefinition[]): void {
    this.modes = modes;
    for (const mode of modes) {
      if (!this.paths.has(mode.id)) {
        const folderName = mode.folder.split("/").pop() ?? mode.folder;
        this.paths.set(mode.id, `${mode.folder}/${folderName}.md`);
      }
    }
    // アクティブモードが削除されていたらリセット
    if (this.activeModeId && !modes.find((m) => m.id === this.activeModeId)) {
      this.activeModeId = null;
      this.onModeChange?.(null);
    }
  }
}
