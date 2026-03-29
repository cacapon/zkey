import { App, TFile } from "obsidian";
import { ZkSettings } from "../settings";
import { genUniqueID, genUniqueAlias } from "../core/idGenerator";
import { collectIDs, collectAliases } from "../core/vaultQuery";
import { getLinkAtCursor } from "../core/editorUtils";
import { updateBacklinksOf } from "../core/backlinkUpdater";
import { loadOrCreateTemplate, applyPlaceholders, DEFAULT_CORE_NOTE_TEMPLATE } from "../core/templateLoader";

export function coreFolderPath(settings: ZkSettings): string {
  const p = settings.coreRootPath;
  return p.substring(0, p.lastIndexOf("/"));
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  if (!app.vault.getFolderByPath(folderPath)) {
    await app.vault.createFolder(folderPath);
  }
}

async function buildNewCoreNote(
  app: App,
  settings: ZkSettings,
  title: string
): Promise<{ content: string; path: string }> {
  const folderPath = coreFolderPath(settings);
  const id = genUniqueID("C", settings.idLen, collectIDs(app, folderPath));
  const alias =
    genUniqueAlias(id, settings.aliasMinLen, collectAliases(app, folderPath)) ??
    id.slice(0, settings.aliasMinLen);

  const parentTitle = app.workspace.getActiveFile()?.basename ?? "HOME";
  const createdDate = new Date().toISOString().split("T")[0];

  const template = await loadOrCreateTemplate(
    app,
    settings.coreNoteTemplatePath,
    DEFAULT_CORE_NOTE_TEMPLATE
  );
  const content = applyPlaceholders(template, {
    id,
    alias,
    created: createdDate,
    parent: parentTitle,
  });
  const path = `${folderPath}/${title}.md`;

  return { content, path };
}

// 同名ファイルが存在する場合、"title 2", "title 3" と連番で一意なタイトルを返す
function resolveUniqueTitle(
  app: App,
  folderPath: string,
  title: string
): string {
  if (!app.vault.getFileByPath(`${folderPath}/${title}.md`)) return title;
  let n = 2;
  while (app.vault.getFileByPath(`${folderPath}/${title} ${n}.md`)) n++;
  return `${title} ${n}`;
}

// Coreノートを新規作成して開く（存在確認なし）
export async function createCoreNote(
  app: App,
  settings: ZkSettings,
  title: string
): Promise<void> {
  const parentFile = app.workspace.getActiveFile(); // 作成前に取得
  const folderPath = coreFolderPath(settings);
  await ensureFolder(app, folderPath);
  const uniqueTitle = resolveUniqueTitle(app, folderPath, title);
  const { content, path } = await buildNewCoreNote(app, settings, uniqueTitle);
  const newFile = await app.vault.create(path, content);
  await app.workspace.getLeaf().openFile(newFile);
  if (settings.enableBacklinks && parentFile instanceof TFile) {
    await updateBacklinksOf(app, parentFile, settings.backlinkExcludePatterns);
  }
}

async function openOrCreateCoreNote(
  app: App,
  settings: ZkSettings,
  title: string
): Promise<void> {
  const sourcePath = app.workspace.getActiveFile()?.path ?? "";
  const existing = app.metadataCache.getFirstLinkpathDest(title, sourcePath);

  if (existing instanceof TFile) {
    await app.workspace.getLeaf().openFile(existing);
    return;
  }

  await createCoreNote(app, settings, title);
}

export async function coreModeCommand(
  app: App,
  settings: ZkSettings
): Promise<void> {
  const editor = app.workspace.activeEditor?.editor;
  if (!editor) return;

  // Case 1: カーソルが [[...]] の内側
  const link = getLinkAtCursor(editor);
  if (link) {
    await openOrCreateCoreNote(app, settings, link.target);
    return;
  }

  // Case 2: 選択なし → 新規Coreノートを作成して開く
  const selection = editor.getSelection();
  if (!selection) {
    await createCoreNote(app, settings, "NewCore");
    return;
  }

  // Case 3: 選択あり → [[選択]] に変換しリンク先を作成して開く
  editor.replaceSelection(`[[${selection}]]`);
  await openOrCreateCoreNote(app, settings, selection);
}
