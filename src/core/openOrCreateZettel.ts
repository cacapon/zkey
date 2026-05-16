import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";
import { Editor } from "./editor";
import { MetadataCache } from "./metadataCache";
import { genUniqueID, genUniqueAlias } from "./idGenerator";

export async function openOrCreateZettel(
  name: string,
  mode: Mode,
  modeList: ModeList,
  fs: FileSystem,
  editor: Editor,
  metadataCache: MetadataCache
): Promise<boolean> {
  const path = `${mode.dirPath}/${name}.md`;
  const created = !await fs.exists(path);

  if (created) {
    let content = await fs.exists(mode.tempPath) ? await fs.readFile(mode.tempPath) : "";
    if (content.includes("{{zkid}}")) {
      const id = genUniqueID(mode.prefix ?? "", 15, metadataCache.getIds(mode.dirPath));
      const alias = genUniqueAlias(id, 4, metadataCache.getAliases(mode.dirPath)) ?? id;
      content = content.replace("{{zkid}}", id).replace("{{alias}}", alias);
    }
    if (content.includes("{{zk-origin}}")) {
      const activePath = editor.getActiveFilePath();
      const originPath = activePath || `${mode.dirPath}/${mode.name}.md`;
      const originName = originPath.split("/").pop()!.replace(/\.md$/, "");
      content = content.replaceAll("{{zk-origin}}", originName);
    }
    await fs.createFile(path, content);
  }

  modeList.updateMode({ ...mode, currPath: path });
  await editor.openNote(path);
  return created;
}
