import { App, Editor, Notice, TFile } from "obsidian";
import { ModeDefinition, ZkSettings } from "../core/zkSettings";
import { ModePathStore } from "../core/modePathStore";
import { getLinkAtCursor } from "../core/editorUtils";
import { detectModeFromPath } from "../core/modeDetector";
import { ModeSuggestModal } from "../ui/modeSuggest";
import { genUniqueID, genUniqueAlias } from "../core/idGenerator";
import { collectIDs, collectAliases } from "../core/vaultQuery";
import { updateBacklinksOf } from "../core/backlinkUpdater";
import { loadOrCreateTemplate, applyPlaceholders, DEFAULT_NOTE_TEMPLATE } from "../core/templateLoader";

// 同名ファイルが存在する場合、"title 2", "title 3" と連番で一意なタイトルを返す
function resolveUniqueTitle(app: App, folder: string, title: string): string {
  if (!app.vault.getFileByPath(`${folder}/${title}.md`)) return title;
  let n = 2;
  while (app.vault.getFileByPath(`${folder}/${title} ${n}.md`)) n++;
  return `${title} ${n}`;
}

async function createNote(
  app: App,
  settings: ZkSettings,
  mode: ModeDefinition,
  title: string
): Promise<void> {
  const parentFile = app.workspace.getActiveFile();

  if (!app.vault.getFolderByPath(mode.folder)) {
    try {
      await app.vault.createFolder(mode.folder);
    } catch {
      // 競合などで既に存在している場合は無視
    }
  }

  const uniqueTitle = resolveUniqueTitle(app, mode.folder, title);
  const id = genUniqueID(mode.idPrefix, settings.idLen, collectIDs(app, mode.folder));
  const alias =
    genUniqueAlias(id, settings.aliasMinLen, collectAliases(app, mode.folder)) ??
    id.slice(0, settings.aliasMinLen);
  const created = new Date().toISOString().split("T")[0];
  const parent = parentFile?.basename ?? mode.folder;

  const template = await loadOrCreateTemplate(app, mode.templatePath, DEFAULT_NOTE_TEMPLATE);
  const content = applyPlaceholders(template, { id, alias, created, parent });
  const path = `${mode.folder}/${uniqueTitle}.md`;

  const newFile = await app.vault.create(path, content);
  await app.workspace.getLeaf().openFile(newFile);

  if (settings.enableBacklinks && parentFile instanceof TFile) {
    await updateBacklinksOf(app, parentFile, settings.backlinkExcludePatterns);
  }
}

async function executeAction(
  app: App,
  editor: Editor,
  mode: ModeDefinition,
  settings: ZkSettings
): Promise<void> {
  const link = getLinkAtCursor(editor);
  const selection = editor.getSelection();
  const target = link?.target ?? selection ?? null;

  if (!target) {
    await createNote(app, settings, mode, "New");
    return;
  }

  const sourcePath = app.workspace.getActiveFile()?.path ?? "";
  const existing = app.metadataCache.getFirstLinkpathDest(target, sourcePath);

  if (existing instanceof TFile) {
    if (!link && selection) editor.replaceSelection(`[[${selection}]]`);
    await app.workspace.getLeaf().openFile(existing);
    return;
  }

  // 存在しない → 新規作成
  if (!link && selection) editor.replaceSelection(`[[${selection}]]`);
  await createNote(app, settings, mode, target);
}

export async function mainActionCommand(
  app: App,
  store: ModePathStore,
  settings: ZkSettings
): Promise<void> {
  const editor = app.workspace.activeEditor?.editor;
  if (!editor) return;

  if (settings.modes.length === 0) {
    new Notice("モードがありません。先にモードを作成してください");
    return;
  }

  // 現在のファイルのパスからモードを自動判定
  const currentFile = app.workspace.getActiveFile();
  const detectedMode = currentFile
    ? detectModeFromPath(currentFile.path, settings.modes)
    : null;

  if (detectedMode) {
    store.setActiveMode(detectedMode);
    await executeAction(app, editor, detectedMode, settings);
    return;
  }

  // 判定できない → storeのアクティブモードを使う
  const storedMode = store.getActiveMode();
  if (storedMode) {
    await executeAction(app, editor, storedMode, settings);
    return;
  }

  // どちらもない → モード選択モーダルを開いて続行
  new ModeSuggestModal(app, settings.modes, async (selected) => {
    store.setActiveMode(selected);
    await executeAction(app, editor, selected, settings);
  }).open();
}
