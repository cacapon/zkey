import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";
import { MetadataCache } from "./metadataCache";
import { genUniqueID, genUniqueAlias } from "./idGenerator";
import defaultTemplate from "./templates/defaultTemplate.md";
import rootTemplate from "./templates/rootTemplate.md";

function applyId(template: string, prefix: string, existingIds: string[], existingAliases: string[]): string {
  if (!template.includes("{{zkid}}")) return template;
  const id = genUniqueID(prefix, 15, existingIds);
  const alias = genUniqueAlias(id, 4, existingAliases) ?? id;
  return template.replace("{{zkid}}", id).replace("{{alias}}", alias);
}

export async function createMode(
  name: string,
  rootPath: string,
  tempPath: string,
  modeList: ModeList,
  fs: FileSystem,
  metadataCache: MetadataCache,
  prefix = "",
  icon = ""
): Promise<boolean> {
  const dirPath = rootPath.includes("/") ? rootPath.split("/").slice(0, -1).join("/") : "";
  const mode: Mode = { name, dirPath, tempPath, currPath: rootPath, rootPath, prefix, icon };

  if (!modeList.addMode(mode)) {
    return false;
  }

  if (!fs.exists(dirPath)) {
    await fs.createFolder(dirPath);
  }

  if (!fs.exists(rootPath)) {
    const ids = metadataCache.getIds(dirPath);
    const aliases = metadataCache.getAliases(dirPath);
    await fs.createFile(rootPath, applyId(rootTemplate, prefix, ids, aliases));
  }

  const tempDir = tempPath.includes("/") ? tempPath.split("/").slice(0, -1).join("/") : null;
  if (tempDir && !fs.exists(tempDir)) {
    await fs.createFolder(tempDir);
  }

  if (!fs.exists(tempPath)) {
    await fs.createFile(tempPath, defaultTemplate);
  }

  return true;
}
