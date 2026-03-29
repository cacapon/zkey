import { App, Notice, TFile } from "obsidian";
import { ZkSettings } from "../settings";
import { getMdFiles } from "../core/vaultQuery";
import { genUniqueID, genUniqueAlias } from "../core/idGenerator";
import { collectIDs, collectAliases } from "../core/vaultQuery";
import { RefSuggestModal, RefSuggestItem } from "../ui/refSuggest";
import { InputModal } from "../ui/inputModal";
import { updateBacklinksOf } from "../core/backlinkUpdater";
import { loadOrCreateTemplate, applyPlaceholders, DEFAULT_REF_NOTE_TEMPLATE } from "../core/templateLoader";

function refFolderPath(settings: ZkSettings): string {
  return settings.refRootPath.substring(0, settings.refRootPath.lastIndexOf("/"));
}

function srcFolderPath(settings: ZkSettings): string {
  return settings.srcRootPath.substring(0, settings.srcRootPath.lastIndexOf("/"));
}

// Srcノートの一覧を取得（Srcフォルダ内のmdファイル）
function getSrcFiles(app: App, settings: ZkSettings): TFile[] {
  return getMdFiles(app, srcFolderPath(settings));
}

// 現在のファイルがRefノートの場合、frontmatterのsrcからSrcファイルを取得
function getSrcFromRefNote(app: App, file: TFile): TFile | null {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  const srcRaw: unknown = fm?.src;
  if (!srcRaw || typeof srcRaw !== "string") return null;
  // "[[SrcTitle]]" → "SrcTitle"
  const srcTitle = srcRaw.replace(/^\[\[|\]\]$/g, "").trim();
  return app.metadataCache.getFirstLinkpathDest(srcTitle, file.path) ?? null;
}

// 現在のファイルがSrcノートかどうかをフォルダ位置で判定
function isSrcFile(file: TFile, settings: ZkSettings): boolean {
  const folder = srcFolderPath(settings);
  return file.path === folder || file.path.startsWith(folder + "/");
}

async function createRefNote(
  app: App,
  settings: ZkSettings,
  srcFile: TFile,
  title: string
): Promise<void> {
  const folderPath = refFolderPath(settings);

  if (!app.vault.getFolderByPath(folderPath)) {
    await app.vault.createFolder(folderPath);
  }

  const id = genUniqueID("R", settings.idLen, collectIDs(app, folderPath));
  const alias =
    genUniqueAlias(id, settings.aliasMinLen, collectAliases(app, folderPath)) ??
    id.slice(0, settings.aliasMinLen);

  const createdDate = new Date().toISOString().split("T")[0];
  const template = await loadOrCreateTemplate(
    app,
    settings.refNoteTemplatePath,
    DEFAULT_REF_NOTE_TEMPLATE
  );
  const content = applyPlaceholders(template, {
    id,
    alias,
    created: createdDate,
    src: srcFile.basename,
  });

  // 同名ファイルの連番処理
  let uniqueTitle = title;
  let n = 2;
  while (app.vault.getFileByPath(`${folderPath}/${uniqueTitle}.md`)) {
    uniqueTitle = `${title} ${n++}`;
  }

  const newFile = await app.vault.create(`${folderPath}/${uniqueTitle}.md`, content);
  await app.workspace.getLeaf().openFile(newFile);
  if (settings.enableBacklinks) {
    await updateBacklinksOf(app, srcFile);
  }
}

export async function refModeCommand(
  app: App,
  settings: ZkSettings
): Promise<void> {
  const currentFile = app.workspace.getActiveFile();
  const srcFiles = getSrcFiles(app, settings);

  // サジェスト候補を構築
  const items: RefSuggestItem[] = [];

  // 現在地点の候補
  if (currentFile) {
    if (isSrcFile(currentFile, settings)) {
      // 現在地点がSrcノート → そのままSrcとして使える
      items.push({
        type: "current",
        label: `現在地点: ${currentFile.basename}（Src）`,
        srcFile: currentFile,
      });
    } else {
      // 現在地点がRefノート → frontmatterからSrc親を辿る
      const srcFromRef = getSrcFromRefNote(app, currentFile);
      if (srcFromRef) {
        items.push({
          type: "current",
          label: `現在地点: ${currentFile.basename} → ${srcFromRef.basename}（Src）`,
          srcFile: srcFromRef,
        });
      }
    }
  }

  // 新規Src作成
  items.push({ type: "new", label: "新規 Src を作成（Book Search）" });

  // Srcノート一覧
  for (const srcFile of srcFiles) {
    items.push({
      type: "src",
      label: srcFile.basename,
      srcFile,
    });
  }

  new RefSuggestModal(app, items, async (item) => {
    if (item.type === "new") {
      // Book Searchコマンドを起動
      const commandId = settings.bookSearchCommandId;
      const executed = (app as any).commands.executeCommandById(commandId);
      if (!executed) {
        new Notice(
          `Book Search が見つかりません。設定でコマンドIDを確認してください。\n（${commandId}）`
        );
      }
      return;
    }

    // タイトルを入力してからRefノートを作成
    new InputModal(app, "Refノートのタイトルを入力", "タイトル名", async (title) => {
      await createRefNote(app, settings, item.srcFile, title);
    }).open();
  }).open();
}
