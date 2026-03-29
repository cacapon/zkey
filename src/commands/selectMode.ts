import { App, TFile } from "obsidian";
import { Mode } from "../core/mode";
import { ModePathStore } from "../core/modePathStore";
import { ModeSuggestModal } from "../ui/modeSuggest";
import { ZkSettings } from "../settings";
import {
  loadOrCreateTemplate,
  DEFAULT_CORE_ROOT_TEMPLATE,
  DEFAULT_REF_ROOT_TEMPLATE,
  DEFAULT_TEMP_ROOT_TEMPLATE,
} from "../core/templateLoader";

function getRootPath(mode: Mode, settings: ZkSettings): string {
  switch (mode) {
    case "Core": return settings.coreRootPath;
    case "Ref":  return settings.refRootPath;
    case "Temp": return settings.tempRootPath;
  }
}

function getRootTemplate(mode: Mode, settings: ZkSettings): { templatePath: string; defaultContent: string } | null {
  switch (mode) {
    case "Core": return { templatePath: settings.coreRootTemplatePath, defaultContent: DEFAULT_CORE_ROOT_TEMPLATE };
    case "Ref":  return { templatePath: settings.refRootTemplatePath,  defaultContent: DEFAULT_REF_ROOT_TEMPLATE };
    case "Temp": return { templatePath: settings.tempRootTemplatePath, defaultContent: DEFAULT_TEMP_ROOT_TEMPLATE };
  }
}

async function openOrCreateNote(
  app: App,
  path: string,
  templateConfig: { templatePath: string; defaultContent: string } | null
): Promise<void> {
  const existing = app.vault.getFileByPath(path);
  if (existing) {
    await app.workspace.getLeaf().openFile(existing);
    return;
  }
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir && !app.vault.getFolderByPath(dir)) {
    await app.vault.createFolder(dir);
  }
  const content = templateConfig
    ? await loadOrCreateTemplate(app, templateConfig.templatePath, templateConfig.defaultContent)
    : "";
  const newFile = await app.vault.create(path, content);
  await app.workspace.getLeaf().openFile(newFile);
}

export async function selectModeCommand(
  app: App,
  store: ModePathStore,
  settings: ZkSettings
): Promise<void> {
  new ModeSuggestModal(app, async (mode: Mode) => {
    store.setActiveMode(mode);

    const currentPath = store.getPath(mode);
    const currentFile = app.vault.getFileByPath(currentPath);

    if (currentFile instanceof TFile) {
      // 現在のパスのノートが存在する → 開く
      await app.workspace.getLeaf().openFile(currentFile);
    } else {
      // 存在しない → rootノートにフォールバック
      const rootPath = getRootPath(mode, settings);
      await openOrCreateNote(app, rootPath, getRootTemplate(mode, settings));
      store.setPath(mode, rootPath);
    }
  }).open();
}
