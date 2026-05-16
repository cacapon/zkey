import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";
import { MetadataCache } from "./metadataCache";
import { genUniqueID, genUniqueAlias } from "./idGenerator";
import defaultTemplate from "./templates/defaultTemplate.md";
import rootTemplate from "./templates/rootTemplate.md";

export interface ModeInput {
  name: string;
  rootPath: string;
  tempPath: string;
  prefix: string;
  icon: string;
}

function applyId(template: string, prefix: string, existingIds: string[], existingAliases: string[]): string {
  if (!template.includes("{{zkid}}")) return template;
  const id = genUniqueID(prefix, 15, existingIds);
  const alias = genUniqueAlias(id, 4, existingAliases) ?? id;
  return template.replace("{{zkid}}", id).replace("{{alias}}", alias);
}

async function moveOrCreate(
  fs: FileSystem,
  src: string | null,
  dst: string,
  create: () => Promise<void>
): Promise<void> {
  if (src && src !== dst && await fs.exists(src)) {
    await fs.rename(src, dst);
  } else if (!await fs.exists(dst)) {
    await create();
  }
}

export async function upsertMode(
  existingMode: Mode | null,
  input: ModeInput,
  modeList: ModeList,
  fs: FileSystem,
  metadataCache: MetadataCache,
  insertOriginInBody = false
): Promise<boolean> {
  const dirPath = input.rootPath.includes("/") ? input.rootPath.split("/").slice(0, -1).join("/") : "";

  // 重複チェック（変更なしの場合のみ除外。大文字小文字だけの変更も重複とみなす）
  const isDuplicate = modeList.getModes().some((m) =>
    m.name.toLowerCase() === input.name.toLowerCase() &&
    !(existingMode && m.name === existingMode.name && input.name === existingMode.name)
  );
  if (isDuplicate) return false;

  // ルートノートのファイル名が変わった場合は zk-origin を更新
  const oldRootName = existingMode?.rootPath.split("/").pop()!.replace(/\.md$/, "") ?? null;
  const newRootName = input.rootPath.split("/").pop()!.replace(/\.md$/, "");
  if (existingMode && oldRootName && oldRootName !== newRootName) {
    for (const filePath of fs.listFiles(existingMode.dirPath)) {
      const content = await fs.readFile(filePath);
      if (content.includes(`[[${oldRootName}]]`)) {
        await fs.writeFile(filePath, content.replaceAll(`[[${oldRootName}]]`, `[[${newRootName}]]`));
      }
    }
  }

  const rootFilename = input.rootPath.split("/").pop()!;
  const rootContent = applyId(rootTemplate, input.prefix, metadataCache.getIds(dirPath), metadataCache.getAliases(dirPath));
  const tempDir = input.tempPath.includes("/") ? input.tempPath.split("/").slice(0, -1).join("/") : null;

  if (existingMode) {
    // 変更時：ルートノートを先に同フォルダ内でリネームしてからフォルダをリネームする。
    // フォルダを先にリネームすると existingMode.rootPath が存在しなくなるため、
    // ルートノートのパスを再計算する必要が生じる。先にリネームすることで回避できる。
    const renamedRootPath = `${existingMode.dirPath}/${rootFilename}`;
    await moveOrCreate(fs, existingMode.rootPath, renamedRootPath, () => fs.createFile(renamedRootPath, rootContent));
    await moveOrCreate(fs, existingMode.dirPath, dirPath, () => fs.createFolder(dirPath));
  } else {
    // 新規作成時：フォルダを先に作成してからルートノートを作成する。
    await moveOrCreate(fs, null, dirPath, () => fs.createFolder(dirPath));
    await moveOrCreate(fs, null, input.rootPath, () => fs.createFile(input.rootPath, rootContent));
  }

  // テンプレートフォルダを作成（移動はしない）
  if (tempDir) await moveOrCreate(fs, null, tempDir, () => fs.createFolder(tempDir));

  // テンプレートを移動または作成
  const templateContent = insertOriginInBody ? `${defaultTemplate}\n↑: [[{{zk-origin}}]]` : defaultTemplate;
  await moveOrCreate(fs, existingMode?.tempPath ?? null, input.tempPath, () => fs.createFile(input.tempPath, templateContent));

  // modeList を更新
  if (existingMode) modeList.deleteMode(existingMode);
  modeList.addMode({
    name: input.name,
    dirPath,
    rootPath: input.rootPath,
    tempPath: input.tempPath,
    currPath: input.rootPath,
    prefix: input.prefix,
    icon: input.icon,
  });

  return true;
}
