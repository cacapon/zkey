import { describe, it, expect, beforeEach, vi } from "vitest";
import { upsertMode, ModeInput } from "../../src/core/upsertMode";
import { ModeList } from "../../src/core/modeList";
import { FileSystem } from "../../src/core/fileSystem";
import { MetadataCache } from "../../src/core/metadataCache";
import { Mode } from "../../src/core/mode";

const makeFs = (existingPaths: string[] = []): FileSystem => ({
  exists: async (path) => existingPaths.includes(path),
  createFolder: vi.fn(),
  createFile: vi.fn(),
  readFile: vi.fn().mockResolvedValue(""),
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

const input: ModeInput = {
  name: "Core",
  rootPath: "/notes/Core/CoreRoot.md",
  tempPath: "/templates/CoreTemplate.md",
  prefix: "",
  icon: "",
};

describe("upsertMode（新規作成）", () => {
  let modeList: ModeList;

  beforeEach(() => {
    modeList = new ModeList();
  });

  it("正常に作成するとtrueを返す", async () => {
    expect(await upsertMode(null, input, modeList, makeFs(), makeMetadataCache())).toBe(true);
  });

  it("同名モードが既にあるとfalseを返す", async () => {
    await upsertMode(null, input, modeList, makeFs(), makeMetadataCache());
    expect(await upsertMode(null, input, modeList, makeFs(), makeMetadataCache())).toBe(false);
  });

  it("大文字小文字が違う同名モードが既にあるとfalseを返す", async () => {
    await upsertMode(null, input, modeList, makeFs(), makeMetadataCache());
    const lower = { ...input, name: "core" };
    expect(await upsertMode(null, lower, modeList, makeFs(), makeMetadataCache())).toBe(false);
  });

  it("作成後にModeListに追加される", async () => {
    await upsertMode(null, input, modeList, makeFs(), makeMetadataCache());
    expect(modeList.getModes().map((m) => m.name)).toContain("Core");
  });

  it("rootPathとcurrPathはルートノートのパスになる", async () => {
    await upsertMode(null, input, modeList, makeFs(), makeMetadataCache());
    const mode = modeList.getModes()[0];
    expect(mode.rootPath).toBe("/notes/Core/CoreRoot.md");
    expect(mode.currPath).toBe("/notes/Core/CoreRoot.md");
  });

  it("dirPathはrootPathの親ディレクトリになる", async () => {
    await upsertMode(null, input, modeList, makeFs(), makeMetadataCache());
    expect(modeList.getModes()[0].dirPath).toBe("/notes/Core");
  });

  it("rootノートが存在しない場合はzkidが置換された内容で作成する", async () => {
    const fs = makeFs();
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    const content = (fs.createFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(content).toMatch(/^---\nzkid: "[^{}"]+"/);
  });

  it("rootノートが既に存在する場合はファイルを作成しない", async () => {
    const fs = makeFs(["/notes/Core/CoreRoot.md"]);
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    expect(fs.createFile).not.toHaveBeenCalledWith("/notes/Core/CoreRoot.md", expect.anything());
  });

  it("dirPathが存在しない場合はフォルダを作成する", async () => {
    const fs = makeFs();
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    expect(fs.createFolder).toHaveBeenCalledWith("/notes/Core");
  });

  it("dirPathが既に存在する場合はフォルダを作成しない", async () => {
    const fs = makeFs(["/notes/Core"]);
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    expect(fs.createFolder).not.toHaveBeenCalledWith("/notes/Core");
  });

  it("tempPathの親フォルダが存在しない場合はフォルダを作成する", async () => {
    const fs = makeFs();
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    expect(fs.createFolder).toHaveBeenCalledWith("/templates");
  });

  it("tempPathが存在しない場合はデフォルトテンプレートで作成する", async () => {
    const fs = makeFs();
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    const call = (fs.createFile as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: string[]) => c[0] === "/templates/CoreTemplate.md"
    );
    expect(call).toBeDefined();
    expect(call![1]).toContain("{{zkid}}");
  });

  it("tempPathが既に存在する場合はテンプレートファイルを作成しない", async () => {
    const fs = makeFs(["/templates/CoreTemplate.md"]);
    await upsertMode(null, input, modeList, fs, makeMetadataCache());
    expect(fs.createFile).not.toHaveBeenCalledWith("/templates/CoreTemplate.md", expect.anything());
  });
});

describe("upsertMode（変更）", () => {
  let modeList: ModeList;
  const existingMode: Mode = {
    name: "Core",
    dirPath: "/notes/Core",
    rootPath: "/notes/Core/CoreRoot.md",
    tempPath: "/templates/CoreTemplate.md",
    currPath: "/notes/Core/CoreRoot.md",
  };

  beforeEach(() => {
    modeList = new ModeList();
    modeList.addMode(existingMode);
  });

  it("正常に変更するとtrueを返す", async () => {
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    expect(await upsertMode(existingMode, newInput, modeList, makeFs(), makeMetadataCache())).toBe(true);
  });

  it("他の既存モードと同名（大文字小文字含む）の場合はfalseを返す", async () => {
    modeList.addMode({ ...existingMode, name: "Other", dirPath: "/notes/Other", rootPath: "/notes/Other/OtherRoot.md", currPath: "/notes/Other/OtherRoot.md" });
    const newInput = { ...input, name: "other" };
    expect(await upsertMode(existingMode, newInput, modeList, makeFs(), makeMetadataCache())).toBe(false);
  });

  it("自分自身と大文字小文字が違う名前はfalseを返す（macでリネーム不可）", async () => {
    const newInput = { ...input, name: "core" };
    expect(await upsertMode(existingMode, newInput, modeList, makeFs(), makeMetadataCache())).toBe(false);
  });

  it("変更後にModeListが新しい名前に更新される", async () => {
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    await upsertMode(existingMode, newInput, modeList, makeFs(), makeMetadataCache());
    expect(modeList.getModes().map((m) => m.name)).toContain("NewName");
    expect(modeList.getModes().map((m) => m.name)).not.toContain("Core");
  });

  it("ルートノートが存在する場合はリネームされる", async () => {
    const fs = makeFs(["/notes/Core/CoreRoot.md"]);
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    await upsertMode(existingMode, newInput, modeList, fs, makeMetadataCache());
    expect(fs.rename).toHaveBeenCalledWith("/notes/Core/CoreRoot.md", "/notes/Core/NewNameRoot.md");
  });

  it("テンプレートが存在する場合はリネームされる", async () => {
    const fs = makeFs(["/templates/CoreTemplate.md"]);
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    await upsertMode(existingMode, newInput, modeList, fs, makeMetadataCache());
    expect(fs.rename).toHaveBeenCalledWith("/templates/CoreTemplate.md", "/templates/NewNameTemplate.md");
  });

  it("フォルダが存在する場合はリネームされる", async () => {
    const fs = makeFs(["/notes/Core"]);
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    await upsertMode(existingMode, newInput, modeList, fs, makeMetadataCache());
    expect(fs.rename).toHaveBeenCalledWith("/notes/Core", "/notes/NewName");
  });

  it("zk-originに旧ルートノート名があるノートは新ルートノート名に更新される", async () => {
    const content = '---\nzkid: "abc"\nzk-origin: "[[CoreRoot]]"\n---\n';
    const fs = makeFs(["/notes/Core/Note.md"]);
    (fs.listFiles as ReturnType<typeof vi.fn>).mockReturnValue(["/notes/Core/Note.md"]);
    (fs.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(content);
    const newInput = { ...input, name: "NewName", rootPath: "/notes/NewName/NewNameRoot.md", tempPath: "/templates/NewNameTemplate.md" };
    await upsertMode(existingMode, newInput, modeList, fs, makeMetadataCache());
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/notes/Core/Note.md",
      '---\nzkid: "abc"\nzk-origin: "[[NewNameRoot]]"\n---\n'
    );
  });
});
