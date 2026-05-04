import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { FileSystem } from "./fileSystem";

export async function renameMode(
  mode: Mode,
  newName: string,
  modeList: ModeList,
  fs: FileSystem
): Promise<boolean> {
  if (modeList.getModes().some((m) => m.name === newName)) return false;

  const newDirPath = mode.dirPath.replace(/[^/]+$/, newName);
  const newTempPath = mode.tempPath.replace(/[^/]+(?=\.md$)/, newName);
  const newRootPath = `${newDirPath}/${newName}.md`;

  // モード内の全ノートのzk-originを更新
  for (const filePath of fs.listFiles(mode.dirPath)) {
    const content = await fs.readFile(filePath);
    if (content.includes(`[[${mode.name}]]`)) {
      const updated = content.replaceAll(`[[${mode.name}]]`, `[[${newName}]]`);
      await fs.writeFile(filePath, updated);
    }
  }

  // ルートノートを同フォルダ内でリネーム（フォルダリネーム前に行う）
  const oldRootPath = `${mode.dirPath}/${mode.name}.md`;
  const renamedRootPath = `${mode.dirPath}/${newName}.md`;
  if (fs.exists(oldRootPath)) {
    await fs.rename(oldRootPath, renamedRootPath);
  }

  // テンプレートのリネーム
  if (fs.exists(mode.tempPath)) {
    await fs.rename(mode.tempPath, newTempPath);
  }

  // フォルダのリネーム（ルートノートも一緒に移動される）
  if (fs.exists(mode.dirPath)) {
    await fs.rename(mode.dirPath, newDirPath);
  }

  modeList.deleteMode(mode);
  modeList.addMode({
    ...mode,
    name: newName,
    dirPath: newDirPath,
    tempPath: newTempPath,
    currPath: newRootPath,
  });

  return true;
}
