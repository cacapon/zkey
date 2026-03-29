import { describe, test, expect, vi, beforeEach } from "vitest";
import { detectDecayedNotes, updateDecayList } from "../../src/core/decayDetector";
import { DEFAULT_SETTINGS } from "../../src/core/zkSettings";
import * as vaultQuery from "../../src/core/vaultQuery";

vi.mock("../../src/core/vaultQuery", () => ({
  getMdFiles: vi.fn(),
}));

const settings = {
  ...DEFAULT_SETTINGS,
  tempRootPath: "Temp/Temp.md",
  decayDays: 14,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function fakeFile(path: string, mtimeOffset: number) {
  return {
    path,
    basename: path.split("/").pop()!.replace(".md", ""),
    stat: { mtime: Date.now() - mtimeOffset },
  };
}

describe("detectDecayedNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("腐敗日数を超えたノートを返す", () => {
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/old.md", 15 * DAY_MS),
    ] as any);

    const result = detectDecayedNotes({} as any, settings);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("Temp/old.md");
  });

  test("腐敗日数以内のノートは返さない", () => {
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/new.md", 5 * DAY_MS),
    ] as any);

    const result = detectDecayedNotes({} as any, settings);
    expect(result).toHaveLength(0);
  });

  test("ルートノートは腐敗していても除外される", () => {
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/Temp.md", 30 * DAY_MS),
    ] as any);

    const result = detectDecayedNotes({} as any, settings);
    expect(result).toHaveLength(0);
  });

  test("腐敗・正常・ルートが混在する場合、腐敗ノートのみ返す", () => {
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/old.md", 15 * DAY_MS),
      fakeFile("Temp/new.md", 5 * DAY_MS),
      fakeFile("Temp/Temp.md", 30 * DAY_MS),
    ] as any);

    const result = detectDecayedNotes({} as any, settings);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("Temp/old.md");
  });

  test("ノートがない場合は空配列を返す", () => {
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([]);

    const result = detectDecayedNotes({} as any, settings);
    expect(result).toHaveLength(0);
  });

  test("decayDays: 1 のとき、1日超えたノートのみ返す", () => {
    const s = { ...settings, decayDays: 1 };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/justOver.md", 25 * 60 * 60 * 1000), // 25時間
      fakeFile("Temp/fresh.md", 30 * 60 * 1000),          // 30分
    ] as any);

    const result = detectDecayedNotes({} as any, s);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("Temp/justOver.md");
  });
});

describe("updateDecayList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("ルートノートが存在しない場合は何もしない", async () => {
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(null),
        read: vi.fn(),
        modify: vi.fn(),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([]);

    await updateDecayList(app as any, settings);
    expect(app.vault.modify).not.toHaveBeenCalled();
  });

  test("DECAY_STARTブロックがない場合は末尾に追加する", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    let written = "";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue("# Temp\n\n初期内容"),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([]);

    await updateDecayList(app as any, settings);
    expect(written).toContain("<!-- DECAY_START -->");
    expect(written).toContain("<!-- DECAY_END -->");
    expect(written).toContain("## 腐敗ノート（自動更新）");
  });

  test("既存のDECAY_STARTブロックを置換する", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    const initial = "# Temp\n\n## 腐敗ノート（自動更新）\n<!-- DECAY_START -->\n- [[old]]\n<!-- DECAY_END -->";
    let written = "";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue(initial),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([]);

    await updateDecayList(app as any, settings);
    expect(written).not.toContain("- [[old]]");
    expect(written).toContain("<!-- DECAY_START -->");
  });

  test("腐敗ノートが存在する場合、そのリンクが書き込まれる", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    let written = "";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue("# Temp\n\n<!-- DECAY_START -->\n<!-- DECAY_END -->"),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/old.md", 15 * DAY_MS),
    ] as any);

    await updateDecayList(app as any, settings);
    expect(written).toContain("[[old]]");
  });

  test("腐敗ノートに経過日数が表示される", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    let written = "";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue("# Temp\n\n<!-- DECAY_START -->\n<!-- DECAY_END -->"),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/old.md", 15 * DAY_MS),
    ] as any);

    await updateDecayList(app as any, settings);
    expect(written).toContain("[[old]] (15日経過)");
  });

  test("古いものから順に並ぶ", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    let written = "";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue("<!-- DECAY_START -->\n<!-- DECAY_END -->"),
        modify: vi.fn().mockImplementation((_f: any, c: string) => { written = c; }),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([
      fakeFile("Temp/newer.md", 20 * DAY_MS),
      fakeFile("Temp/older.md", 30 * DAY_MS),
    ] as any);

    await updateDecayList(app as any, settings);
    const olderPos = written.indexOf("[[older]]");
    const newerPos = written.indexOf("[[newer]]");
    expect(olderPos).toBeLessThan(newerPos);
  });

  test("内容に変化がない場合はmodifyを呼ばない", async () => {
    const rootFile = { path: "Temp/Temp.md", basename: "Temp" };
    const emptySection = "# Temp\n\n<!-- DECAY_START -->\n<!-- DECAY_END -->";
    const app = {
      vault: {
        getFileByPath: vi.fn().mockReturnValue(rootFile),
        read: vi.fn().mockResolvedValue(emptySection),
        modify: vi.fn(),
      },
    };
    vi.mocked(vaultQuery.getMdFiles).mockReturnValue([]);

    await updateDecayList(app as any, settings);
    expect(app.vault.modify).not.toHaveBeenCalled();
  });
});
