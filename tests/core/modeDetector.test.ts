import { describe, test, expect } from "vitest";
import { detectModeFromPath } from "../../src/core/modeDetector";
import { ModeDefinition } from "../../src/core/zkSettings";

const modes: ModeDefinition[] = [
  { id: "core", name: "Core", folder: "Core", idPrefix: "C", color: "#4ade80", templatePath: "Meta/Template/zk-core-note.md" },
  { id: "ref",  name: "Ref",  folder: "Ref",  idPrefix: "R", color: "#38bdf8", templatePath: "Meta/Template/zk-ref-note.md" },
  { id: "temp", name: "Temp", folder: "Temp", idPrefix: "T", color: "#facc15", templatePath: "Meta/Template/zk-temp-note.md" },
];

describe("detectModeFromPath", () => {
  test("Coreフォルダ以下のファイルはCoreモードと判定される", () => {
    const result = detectModeFromPath("Core/someNote.md", modes);
    expect(result?.id).toBe("core");
  });

  test("Refフォルダ以下のファイルはRefモードと判定される", () => {
    const result = detectModeFromPath("Ref/someNote.md", modes);
    expect(result?.id).toBe("ref");
  });

  test("Tempフォルダ以下のファイルはTempモードと判定される", () => {
    const result = detectModeFromPath("Temp/someNote.md", modes);
    expect(result?.id).toBe("temp");
  });

  test("サブフォルダ内のファイルも正しく判定される", () => {
    const result = detectModeFromPath("Core/sub/deep.md", modes);
    expect(result?.id).toBe("core");
  });

  test("どのモードにも属さないファイルはnullを返す", () => {
    expect(detectModeFromPath("Other/note.md", modes)).toBeNull();
  });

  test("フォルダ名の前方一致では誤判定しない", () => {
    expect(detectModeFromPath("CoreExtra/note.md", modes)).toBeNull();
  });

  test("ルートノート自体もそのモードと判定される", () => {
    const result = detectModeFromPath("Core/Core.md", modes);
    expect(result?.id).toBe("core");
  });
});
