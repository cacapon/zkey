import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  isInAnyMode,
  getBacklinkFiles,
  buildBacklinkSection,
  updateBacklinksOf,
} from "../../src/core/backlinkUpdater";
import { ModeDefinition } from "../../src/core/zkSettings";
import { TFile } from "../../tests/__mocks__/obsidian";

const modes: ModeDefinition[] = [
  { id: "core", name: "Core", folder: "Core", idPrefix: "C", color: "#4ade80", templatePath: "Meta/Template/zk-core-note.md" },
  { id: "ref",  name: "Ref",  folder: "Ref",  idPrefix: "R", color: "#38bdf8", templatePath: "Meta/Template/zk-ref-note.md" },
];

function fakeFile(path: string, mtime = 1000): TFile {
  return new TFile(path, mtime);
}

// =========================================================
// isInAnyMode
// =========================================================

describe("isInAnyMode", () => {
  test("Coreフォルダ内のパスはtrueを返す", () => {
    expect(isInAnyMode("Core/someNote.md", modes)).toBe(true);
  });

  test("Refフォルダ内のパスはtrueを返す", () => {
    expect(isInAnyMode("Ref/someNote.md", modes)).toBe(true);
  });

  test("どのモードにも属さないパスはfalseを返す", () => {
    expect(isInAnyMode("Temp/note.md", modes)).toBe(false);
    expect(isInAnyMode("Other/note.md", modes)).toBe(false);
  });

  test("フォルダ名の前方一致では誤判定しない", () => {
    expect(isInAnyMode("CoreExtra/note.md", modes)).toBe(false);
  });

  test("除外パターンにマッチするパスはfalseを返す", () => {
    const templateModes: ModeDefinition[] = [
      { id: "meta", name: "Meta", folder: "Meta/Template", idPrefix: "M", color: "#fff", templatePath: "" },
    ];
    expect(isInAnyMode("Meta/Template/note.md", templateModes, ["Meta/Template/**"])).toBe(false);
  });
});

// =========================================================
// getBacklinkFiles
// =========================================================

describe("getBacklinkFiles", () => {
  test("通常リンク [[]] を持つファイルを返す", () => {
    const target = fakeFile("Core/target.md");
    const source = fakeFile("Core/source.md");

    const app = {
      metadataCache: {
        resolvedLinks: { "Core/source.md": { "Core/target.md": 1 } },
        getFileCache: vi.fn().mockReturnValue({
          links: [{ link: "target" }],
        }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(target),
      },
      vault: {
        getFileByPath: vi.fn().mockImplementation((p: string) =>
          p === "Core/source.md" ? source : null
        ),
      },
    };

    const result = getBacklinkFiles(app as any, target as any);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("Core/source.md");
  });

  test("埋め込みリンク ![[]] しか持たないファイルは除外される", () => {
    const target = fakeFile("Core/target.md");
    const source = fakeFile("Core/source.md");

    const app = {
      metadataCache: {
        resolvedLinks: { "Core/source.md": { "Core/target.md": 1 } },
        // links がない（embeds のみ）
        getFileCache: vi.fn().mockReturnValue({ embeds: [{ link: "target" }] }),
        getFirstLinkpathDest: vi.fn(),
      },
      vault: {
        getFileByPath: vi.fn().mockReturnValue(source),
      },
    };

    const result = getBacklinkFiles(app as any, target as any);
    expect(result).toHaveLength(0);
  });

  test("自分自身はバックリンクに含まれない", () => {
    const target = fakeFile("Core/target.md");

    const app = {
      metadataCache: {
        resolvedLinks: { "Core/target.md": { "Core/target.md": 1 } },
        getFileCache: vi.fn().mockReturnValue({ links: [{ link: "target" }] }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(target),
      },
      vault: {
        getFileByPath: vi.fn().mockReturnValue(target),
      },
    };

    const result = getBacklinkFiles(app as any, target as any);
    expect(result).toHaveLength(0);
  });

  test("excludePatternsにマッチするソースファイルは除外される", () => {
    const target = fakeFile("Core/target.md");
    const source = fakeFile("Meta/Template/source.md");

    const app = {
      metadataCache: {
        resolvedLinks: { "Meta/Template/source.md": { "Core/target.md": 1 } },
        getFileCache: vi.fn().mockReturnValue({ links: [{ link: "target" }] }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(target),
      },
      vault: {
        getFileByPath: vi.fn().mockReturnValue(source),
      },
    };

    const result = getBacklinkFiles(app as any, target as any, ["Meta/Template/**"]);
    expect(result).toHaveLength(0);
  });

  test("excludePatternsが空の場合は除外しない", () => {
    const target = fakeFile("Core/target.md");
    const source = fakeFile("Meta/Template/source.md");

    const app = {
      metadataCache: {
        resolvedLinks: { "Meta/Template/source.md": { "Core/target.md": 1 } },
        getFileCache: vi.fn().mockReturnValue({ links: [{ link: "target" }] }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(target),
      },
      vault: {
        getFileByPath: vi.fn().mockReturnValue(source),
      },
    };

    const result = getBacklinkFiles(app as any, target as any, []);
    expect(result).toHaveLength(1);
  });

  test("更新日時の新しい順に並ぶ", () => {
    const target = fakeFile("Core/target.md");
    const older  = fakeFile("Core/older.md", 1000);
    const newer  = fakeFile("Core/newer.md", 9000);

    const app = {
      metadataCache: {
        resolvedLinks: {
          "Core/older.md": { "Core/target.md": 1 },
          "Core/newer.md": { "Core/target.md": 1 },
        },
        getFileCache: vi.fn().mockReturnValue({ links: [{ link: "target" }] }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(target),
      },
      vault: {
        getFileByPath: vi.fn().mockImplementation((p: string) => {
          if (p === "Core/older.md") return older;
          if (p === "Core/newer.md") return newer;
          return null;
        }),
      },
    };

    const result = getBacklinkFiles(app as any, target as any);
    expect(result[0].path).toBe("Core/newer.md");
    expect(result[1].path).toBe("Core/older.md");
  });
});

// =========================================================
// buildBacklinkSection
// =========================================================

describe("buildBacklinkSection", () => {
  test("バックリンクがない場合は空のブロックを返す", () => {
    const app = { metadataCache: { getFileCache: vi.fn().mockReturnValue(null) } };
    const result = buildBacklinkSection([], app as any);
    expect(result).toBe("<!-- ZK_BACKLINKS_START -->\n<!-- ZK_BACKLINKS_END -->");
  });

  test("ヘッダー行とデータ行を | 区切りで出力する", () => {
    const file = fakeFile("Core/note.md", 1743120000000); // 2025-03-28
    const app = {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: { aliases: ["Cnot"], created: "2025-01-01" },
        }),
      },
    };
    const result = buildBacklinkSection([file as any], app as any);
    expect(result).toContain("[[note]] | Cnot | 2025-01-01 |");
    // ヘッダー行が含まれることを確認（テーブル記法ではない）
    expect(result).toContain("ノート | エイリアス | 作成日 | 更新日");
    expect(result).not.toContain("| --- |");
  });

  test("Aliasがない場合は空文字になる", () => {
    const file = fakeFile("Core/note.md", 1743120000000);
    const app = {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({ frontmatter: {} }),
      },
    };
    const result = buildBacklinkSection([file as any], app as any);
    expect(result).toContain("[[note]] |  |  |");
  });
});

// =========================================================
// updateBacklinksOf
// =========================================================

describe("updateBacklinksOf", () => {
  beforeEach(() => vi.clearAllMocks());

  test("バックリンクが存在する場合、セクションを書き込む", async () => {
    const targetFile = fakeFile("Core/note.md");
    const backlinker = fakeFile("Core/other.md");
    let written = "";

    const app = {
      metadataCache: {
        resolvedLinks: { "Core/other.md": { "Core/note.md": 1 } },
        getFileCache: vi.fn().mockReturnValue({ links: [{ link: "note" }] }),
        getFirstLinkpathDest: vi.fn().mockReturnValue(targetFile),
      },
      vault: {
        getFileByPath: vi.fn().mockReturnValue(backlinker),
        read: vi.fn().mockResolvedValue("<!-- ZK_BACKLINKS_START -->\n<!-- ZK_BACKLINKS_END -->"),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };

    await updateBacklinksOf(app as any, targetFile as any);

    expect(app.vault.modify).toHaveBeenCalledOnce();
    expect(written).toContain("[[other]]");
  });

  test("ZK_BACKLINKSブロックがないノートは変更しない", async () => {
    const targetFile = fakeFile("Core/note.md");

    const app = {
      metadataCache: {
        resolvedLinks: {},
        getFileCache: vi.fn(),
        getFirstLinkpathDest: vi.fn(),
      },
      vault: {
        getFileByPath: vi.fn(),
        read: vi.fn().mockResolvedValue("# note\n\nバックリンクブロックなし"),
        modify: vi.fn(),
      },
    };

    await updateBacklinksOf(app as any, targetFile as any);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });

  test("内容に変化がない場合はmodifyを呼ばない", async () => {
    const targetFile = fakeFile("Core/note.md");
    const content = "<!-- ZK_BACKLINKS_START -->\n<!-- ZK_BACKLINKS_END -->";

    const app = {
      metadataCache: {
        resolvedLinks: {},
        getFileCache: vi.fn().mockReturnValue(null),
        getFirstLinkpathDest: vi.fn().mockReturnValue(null),
      },
      vault: {
        getFileByPath: vi.fn(),
        read: vi.fn().mockResolvedValue(content),
        modify: vi.fn(),
      },
    };

    await updateBacklinksOf(app as any, targetFile as any);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });
});
