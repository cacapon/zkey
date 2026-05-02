import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";
import { Editor } from "./editor";

export async function openOrCreateZettel(
  name: string,
  mode: Mode,
  modeList: ModeList,
  fs: FileSystem,
  editor: Editor
): Promise<boolean> {
  const path = `${mode.dirPath}/${name}.md`;
  const created = !fs.exists(path);

  if (created) {
    const content = fs.exists(mode.tempPath) ? await fs.readFile(mode.tempPath) : "";
    await fs.createFile(path, content);
  }

  modeList.updateMode({ ...mode, currPath: path });
  await editor.openNote(path);
  return created;
}
