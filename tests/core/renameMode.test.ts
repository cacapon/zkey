import { describe, it, expect, beforeEach, vi } from "vitest";
import { renameMode } from "../../src/core/renameMode";
import { ModeList } from "../../src/core/modeList";
import { FileSystem } from "../../src/core/fileSystem";
import { Mode } from "../../src/core/mode";

const mode: Mode = {
  name: "Core",
  dirPath: "/notes/Core",
  tempPath: "/templates/Core.md",
  currPath: "/notes/Core/Core.md",
  rootPath: "/notes/Core/Core.md",
};

const makeFs = (existingPaths: string[] = [], fileContents: Record<string, string> = {}): FileSystem => ({
  exists: async (path) => existingPaths.includes(path),
  createFolder: vi.fn(),
  createFile: vi.fn(),
  readFile: vi.fn().mockImplementation((path: string) => Promise.resolve(fileContents[path] ?? "")),
  writeFile: vi.fn(),
  rename: vi.fn(),
  listFiles: vi.fn().mockReturnValue(Object.keys(fileContents)),
});

describe("renameMode", () => {
  let modeList: ModeList;

  beforeEach(() => {
    modeList = new ModeList();
    modeList.addMode(mode);
  });

  it("正常にリネームするとtrueを返す", async () => {
    const fs = makeFs(["/notes/Core", "/notes/Core/Core.md", "/templates/Core.md"]);
    const result = await renameMode(mode, "NewName", modeList, fs);
    expect(result).toBe(true);
  });

  it("同名モードが既にある場合はfalseを返す", async () => {
    modeList.addMode({ ...mode, name: "NewName", dirPath: "/notes/NewName", tempPath: "/templates/NewName.md", currPath: "/notes/NewName/NewName.md" });
    const fs = makeFs();
    const result = await renameMode(mode, "NewName", modeList, fs);
    expect(result).toBe(false);
  });

  it("ルートノートが存在する場合は同フォルダ内でリネームされる", async () => {
    const fs = makeFs(["/notes/Core/Core.md"]);
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.rename).toHaveBeenCalledWith("/notes/Core/Core.md", "/notes/Core/NewName.md");
  });

  it("テンプレートが存在する場合はリネームされる", async () => {
    const fs = makeFs(["/templates/Core.md"]);
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.rename).toHaveBeenCalledWith("/templates/Core.md", "/templates/NewName.md");
  });

  it("フォルダが存在する場合はリネームされる", async () => {
    const fs = makeFs(["/notes/Core"]);
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.rename).toHaveBeenCalledWith("/notes/Core", "/notes/NewName");
  });

  it("zk-originに旧名があるノートは新名に更新される", async () => {
    const content = '---\nzkid: "abc"\nzk-origin: "[[Core]]"\n---\n';
    const fs = makeFs(
      ["/notes/Core/Note.md"],
      { "/notes/Core/Note.md": content }
    );
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/notes/Core/Note.md",
      '---\nzkid: "abc"\nzk-origin: "[[NewName]]"\n---\n'
    );
  });

  it("zk-originがないノートはwriteFileを呼ばない", async () => {
    const content = '---\nzkid: "abc"\n---\n\n# メモ\n本文のみ';
    const fs = makeFs(
      ["/notes/Core/Note.md"],
      { "/notes/Core/Note.md": content }
    );
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("旧名と新名が混在するノートは旧名のみ置換される", async () => {
    const content = '---\nzk-origin: "[[Core]]"\n---\n\n[[Core]]について。[[Other]]も参照。';
    const fs = makeFs(
      ["/notes/Core/Note.md"],
      { "/notes/Core/Note.md": content }
    );
    await renameMode(mode, "NewName", modeList, fs);
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/notes/Core/Note.md",
      '---\nzk-origin: "[[NewName]]"\n---\n\n[[NewName]]について。[[Other]]も参照。'
    );
  });

  it("ModeListのモード情報が新しい名前に更新される", async () => {
    const fs = makeFs();
    await renameMode(mode, "NewName", modeList, fs);
    expect(modeList.getModes()[0].name).toBe("NewName");
    expect(modeList.getModes()[0].dirPath).toBe("/notes/NewName");
    expect(modeList.getModes()[0].tempPath).toBe("/templates/NewName.md");
  });
});
