import { ModeDefinition } from "./zkSettings";

// ファイルパスからモードを判定する。どのモードにも属さない場合はnullを返す。
export function detectModeFromPath(
  filePath: string,
  modes: ModeDefinition[]
): ModeDefinition | null {
  for (const mode of modes) {
    const folder = mode.folder;
    if (filePath === folder || filePath.startsWith(folder + "/")) {
      return mode;
    }
  }
  return null;
}
