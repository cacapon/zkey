import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMode } from "../../src/core/createMode";
import { ModeList } from "../../src/core/modeList";
import { FileSystem } from "../../src/core/fileSystem";
import { MetadataCache } from "../../src/core/metadataCache";

const makeFs = (existingPaths: string[] = []): FileSystem => ({
  exists: (path) => existingPaths.includes(path),
  createFolder: vi.fn(),
  createFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  listFiles: vi.fn().mockReturnValue([]),
});

const makeMetadataCache = (): MetadataCache => ({
  getIds: vi.fn().mockReturnValue([]),
  getAliases: vi.fn().mockReturnValue([]),
  getForwardLinks: vi.fn().mockReturnValue([]),
  getBacklinks: vi.fn().mockReturnValue([]),
  resolveLink: vi.fn().mockReturnValue(null),
});

describe("createMode", () => {
  let modeList: ModeList;

  beforeEach(() => {
    modeList = new ModeList();
  });

  it("正常に作成するとtrueを返す", async () => {
    const result = await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    expect(result).toBe(true);
  });

  it("同名モードが既にあるとfalseを返す", async () => {
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    const result = await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    expect(result).toBe(false);
  });

  it("作成後にModeListに追加される", async () => {
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    expect(modeList.getModes().map((m) => m.name)).toContain("Core");
  });

  it("currPathとrootPathはrootノートのパスになる", async () => {
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    const mode = modeList.getModes()[0];
    expect(mode.currPath).toBe("/notes/Core/CoreRoot.md");
    expect(mode.rootPath).toBe("/notes/Core/CoreRoot.md");
  });

  it("dirPathはrootPathの親ディレクトリになる", async () => {
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache());
    expect(modeList.getModes()[0].dirPath).toBe("/notes/Core");
  });

  it("prefixがModeに保存される", async () => {
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, makeFs(), makeMetadataCache(), "C");
    expect(modeList.getModes()[0].prefix).toBe("C");
  });

  it("rootノートが存在しない場合はzkidが置換された内容で作成する", async () => {
    const fs = makeFs();
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    const content = (fs.createFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(content).toMatch(/^---\nzkid: "[^{}"]+"/);
  });

  it("rootノートが既に存在する場合はファイルを作成しない", async () => {
    const fs = makeFs(["/notes/Core/CoreRoot.md"]);
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFile).not.toHaveBeenCalledWith("/notes/Core/CoreRoot.md", expect.anything());
  });

  it("dirPathが存在しない場合はフォルダを作成する", async () => {
    const fs = makeFs();
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFolder).toHaveBeenCalledWith("/notes/Core");
  });

  it("dirPathが既に存在する場合はdirPathのフォルダを作成しない", async () => {
    const fs = makeFs(["/notes/Core"]);
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFolder).not.toHaveBeenCalledWith("/notes/Core");
  });

  it("tempPathの親フォルダが存在しない場合はフォルダを作成する", async () => {
    const fs = makeFs();
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFolder).toHaveBeenCalledWith("/templates");
  });

  it("tempPathの親フォルダが既に存在する場合はフォルダを作成しない", async () => {
    const fs = makeFs(["/templates"]);
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFolder).not.toHaveBeenCalledWith("/templates");
  });

  it("tempPathが存在しない場合はdefaultTemplateの内容で作成する", async () => {
    const fs = makeFs();
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    const call = (fs.createFile as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: string[]) => c[0] === "/templates/CoreTemplate.md"
    );
    expect(call).toBeDefined();
    expect(call![1]).toContain("{{zkid}}");
  });

  it("tempPathが既に存在する場合はテンプレートファイルを作成しない", async () => {
    const fs = makeFs(["/templates/CoreTemplate.md"]);
    await createMode("Core", "/notes/Core/CoreRoot.md", "/templates/CoreTemplate.md", modeList, fs, makeMetadataCache());
    expect(fs.createFile).not.toHaveBeenCalledWith("/templates/CoreTemplate.md", expect.anything());
  });
});
