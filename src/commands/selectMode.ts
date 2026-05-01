import { App, TFile } from "obsidian";
import { ModeDefinition, ZkSettings } from "../core/zkSettings";
import { ModePathStore } from "../core/modePathStore";
import { ModeSuggestModal } from "../ui/modeSuggest";

async function openOrCreateRootNote(app: App, mode: ModeDefinition): Promise<void> {
  const folderName = mode.folder.split("/").pop() ?? mode.folder;
  const rootPath = `${mode.folder}/${folderName}.md`;
  const existing = app.vault.getFileByPath(rootPath);
  if (existing instanceof TFile) {
    await app.workspace.getLeaf().openFile(existing);
    return;
  }
  if (!app.vault.getFolderByPath(mode.folder)) {
    await app.vault.createFolder(mode.folder);
  }
  const newFile = await app.vault.create(rootPath, "");
  await app.workspace.getLeaf().openFile(newFile);
}

export async function selectModeCommand(
  app: App,
  store: ModePathStore,
  settings: ZkSettings,
  onCreateNew?: () => void
): Promise<void> {
  new ModeSuggestModal(app, settings.modes, async (mode: ModeDefinition) => {
    store.setActiveMode(mode);

    const currentPath = store.getPath(mode.id);
    const currentFile = app.vault.getFileByPath(currentPath);

    if (currentFile instanceof TFile) {
      await app.workspace.getLeaf().openFile(currentFile);
    } else {
      await openOrCreateRootNote(app, mode);
      const fn = mode.folder.split("/").pop() ?? mode.folder;
      store.setPath(mode.id, `${mode.folder}/${fn}.md`);
    }
  }, onCreateNew).open();
}
