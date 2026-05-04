import { describe, it, expect, beforeEach, vi } from "vitest";
import { openOrCreateZettel } from "../../src/core/openOrCreateZettel";
import { ModeList } from "../../src/core/modeList";
import { FileSystem } from "../../src/core/fileSystem";
import { Editor } from "../../src/core/editor";
import { MetadataCache } from "../../src/core/metadataCache";
import { Mode } from "../../src/core/mode";

const mode: Mode = {
  name: "Core",
  dirPath: "/notes/Core",
  tempPath: "/templates/Core.md",
  currPath: "/notes/Core/Core.md",
};

const makeFs = (existingPaths: string[] = [], templateContent = ""): FileSystem => ({
  exists: (path) => existingPaths.includes(path),
  createFolder: vi.fn(),
  createFile: vi.fn(),
  readFile: vi.fn().mockResolvedValue(templateContent),
  writeFile: vi.fn(),
  rename: vi.fn(),
  listFiles: vi.fn().mockReturnValue([]),
});

const makeEditor = (activeFilePath: string | null = "/notes/Core/Core.md"): Editor => ({
  openNote: vi.fn(),
  getSelection: vi.fn(),
  replaceSelection: vi.fn(),
  getActiveFilePath: vi.fn().mockReturnValue(activeFilePath),
});

const makeMetadataCache = (): MetadataCache => ({
  getIds: vi.fn().mockReturnValue([]),
  getAliases: vi.fn().mockReturnValue([]),
});

describe("openOrCreateZettel", () => {
  let modeList: ModeList;

  beforeEach(() => {
    modeList = new ModeList();
    modeList.addMode(mode);
  });

  it("ノートが存在しない場合は作成してtrueを返す", async () => {
    const fs = makeFs();
    const result = await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", "");
    expect(result).toBe(true);
  });

  it("テンプレートが存在する場合はその内容でノートを作成する", async () => {
    const fs = makeFs(["/templates/Core.md"], "# {{title}}");
    await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", "# {{title}}");
  });

  it("テンプレートが存在しない場合は空ファイルを作成する", async () => {
    const fs = makeFs();
    await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", "");
  });

  it("ノートが既に存在する場合は作成せずfalseを返す", async () => {
    const fs = makeFs(["/notes/Core/NewNote.md"]);
    const result = await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    expect(fs.createFile).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("currPathが更新される", async () => {
    await openOrCreateZettel("NewNote", mode, modeList, makeFs(), makeEditor(), makeMetadataCache());
    expect(modeList.getModes()[0].currPath).toBe("/notes/Core/NewNote.md");
  });

  it("editor.openNoteが呼ばれる", async () => {
    const editor = makeEditor();
    await openOrCreateZettel("NewNote", mode, modeList, makeFs(), editor, makeMetadataCache());
    expect(editor.openNote).toHaveBeenCalledWith("/notes/Core/NewNote.md");
  });

  it("テンプレートに{{zkid}}がある場合はIDとaliasに置換される", async () => {
    const template = '---\nzkid: "{{zkid}}"\naliases: ["{{alias}}"]\n---\n';
    const fs = makeFs(["/templates/Core.md"], template);
    await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    const content = (fs.createFile as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(content).not.toContain("{{zkid}}");
    expect(content).not.toContain("{{alias}}");
    expect(content).toMatch(/zkid: "[^"]+"/);
  });

  it("テンプレートに{{zkid}}がない場合はそのまま作成する", async () => {
    const template = "# メモ\n";
    const fs = makeFs(["/templates/Core.md"], template);
    await openOrCreateZettel("NewNote", mode, modeList, fs, makeEditor(), makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", template);
  });

  it("テンプレートに{{origin}}がある場合はアクティブファイル名のwikilinkに置換される", async () => {
    const template = 'zk-origin: "[[{{origin}}]]"';
    const fs = makeFs(["/templates/Core.md"], template);
    const editor = makeEditor("/notes/Core/ParentNote.md");
    await openOrCreateZettel("NewNote", mode, modeList, fs, editor, makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", 'zk-origin: "[[ParentNote]]"');
  });

  it("アクティブファイルがない場合はルートノート名をoriginにする", async () => {
    const template = 'zk-origin: "[[{{origin}}]]"';
    const fs = makeFs(["/templates/Core.md"], template);
    const editor = makeEditor(null);
    await openOrCreateZettel("NewNote", mode, modeList, fs, editor, makeMetadataCache());
    expect(fs.createFile).toHaveBeenCalledWith("/notes/Core/NewNote.md", 'zk-origin: "[[Core]]"');
  });
});
