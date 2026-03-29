import { App } from "obsidian";
import { ZkSettings } from "../settings";
import {
  DEFAULT_CORE_NOTE_TEMPLATE,
  DEFAULT_REF_NOTE_TEMPLATE,
  DEFAULT_CORE_ROOT_TEMPLATE,
  DEFAULT_REF_ROOT_TEMPLATE,
  DEFAULT_TEMP_ROOT_TEMPLATE,
} from "../core/templateLoader";
import { ConfirmModal } from "../ui/confirmModal";
import { InitResultModal, InitResultItem } from "../ui/initResultModal";

// テンプレートファイルを作成（既存ならスキップ）
async function initTemplateFile(
  app: App,
  templatePath: string,
  defaultContent: string,
  label: string
): Promise<InitResultItem> {
  if (app.vault.getFileByPath(templatePath)) {
    return { label, status: "skipped" };
  }
  const dir = templatePath.substring(0, templatePath.lastIndexOf("/"));
  if (dir && !app.vault.getFolderByPath(dir)) {
    await app.vault.createFolder(dir);
  }
  await app.vault.create(templatePath, defaultContent);
  return { label, status: "created" };
}

// ルートノートを強制リセット（上書き）
async function resetRootNote(
  app: App,
  rootPath: string,
  content: string,
  label: string
): Promise<InitResultItem> {
  const dir = rootPath.substring(0, rootPath.lastIndexOf("/"));
  if (dir && !app.vault.getFolderByPath(dir)) {
    await app.vault.createFolder(dir);
  }
  const existing = app.vault.getFileByPath(rootPath);
  if (existing) {
    await app.vault.modify(existing, content);
  } else {
    await app.vault.create(rootPath, content);
  }
  return { label, status: "reset" };
}

async function runInitialize(app: App, settings: ZkSettings): Promise<void> {
  const results: InitResultItem[] = [];

  // テンプレートファイル（既存ならスキップ）
  results.push(await initTemplateFile(app, settings.coreNoteTemplatePath,  DEFAULT_CORE_NOTE_TEMPLATE,  "Coreノート テンプレート"));
  results.push(await initTemplateFile(app, settings.refNoteTemplatePath,   DEFAULT_REF_NOTE_TEMPLATE,   "Refノート テンプレート"));
  results.push(await initTemplateFile(app, settings.coreRootTemplatePath,  DEFAULT_CORE_ROOT_TEMPLATE,  "CoreRoot テンプレート"));
  results.push(await initTemplateFile(app, settings.refRootTemplatePath,   DEFAULT_REF_ROOT_TEMPLATE,   "RefRoot テンプレート"));
  results.push(await initTemplateFile(app, settings.tempRootTemplatePath,  DEFAULT_TEMP_ROOT_TEMPLATE,  "TempRoot テンプレート"));

  // ルートノート（強制リセット）
  results.push(await resetRootNote(app, settings.coreRootPath, DEFAULT_CORE_ROOT_TEMPLATE, "Core ルートノート"));
  results.push(await resetRootNote(app, settings.refRootPath,  DEFAULT_REF_ROOT_TEMPLATE,  "Ref ルートノート"));
  results.push(await resetRootNote(app, settings.tempRootPath, DEFAULT_TEMP_ROOT_TEMPLATE, "Temp ルートノート"));

  new InitResultModal(app, results).open();
}

export function initializeCommand(app: App, settings: ZkSettings): void {
  new ConfirmModal(
    app,
    "Core / Ref / Temp のルートノートを初期化します。既存の内容は上書きされます。テンプレートファイルは存在する場合スキップされます。",
    () => runInitialize(app, settings)
  ).open();
}
