import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";

export async function createMode(
  name: string,
  dirPath: string,
  tempPath: string,
  modeList: ModeList,
  fs: FileSystem
): Promise<boolean> {
  const mode: Mode = { name, dirPath, tempPath, currPath: dirPath };

  if (!modeList.addMode(mode)) {
    return false;
  }

  if (!fs.exists(dirPath)) {
    await fs.createFolder(dirPath);
  }

  if (!fs.exists(tempPath)) {
    await fs.createFile(tempPath, "");
  }

  return true;
}
