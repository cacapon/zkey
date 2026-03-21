import { App, TFile } from "obsidian";
import { Mode } from "../core/mode";
import { ModePathStore } from "../core/modePathStore";
import { ModeSuggestModal } from "../ui/modeSuggest";
import { ZkSettings } from "../settings";

function getRootPath(mode: Mode, settings: ZkSettings): string {
  switch (mode) {
    case "Core": return settings.coreRootPath;
    case "Ref":  return settings.refRootPath;
    case "Temp": return settings.tempRootPath;
  }
}

async function openOrCreateNote(app: App, path: string): Promise<void> {
  const existing = app.vault.getFileByPath(path);
  if (existing) {
    await app.workspace.getLeaf().openFile(existing);
    return;
  }
  // フォルダが存在しない場合は作成
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir && !app.vault.getFolderByPath(dir)) {
    await app.vault.createFolder(dir);
  }
  const newFile = await app.vault.create(path, "");
  await app.workspace.getLeaf().openFile(newFile);
}

export async function selectModeCommand(
  app: App,
  store: ModePathStore,
  settings: ZkSettings
): Promise<void> {
  new ModeSuggestModal(app, async (mode: Mode) => {
    const currentPath = store.getPath(mode);
    const currentFile = app.vault.getFileByPath(currentPath);

    if (currentFile instanceof TFile) {
      // 現在のパスのノートが存在する → 開く
      await app.workspace.getLeaf().openFile(currentFile);
    } else {
      // 存在しない → rootノートにフォールバック
      const rootPath = getRootPath(mode, settings);
      await openOrCreateNote(app, rootPath);
      store.setPath(mode, rootPath);
    }
  }).open();
}
