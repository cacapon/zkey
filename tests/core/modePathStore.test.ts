import { describe, test, expect, beforeEach } from 'vitest';
import { ModeDefinition } from "../../src/core/zkSettings";
import { ModePathStore } from "../../src/core/modePathStore";

const coreDef: ModeDefinition = { id: "core", name: "Core", folder: "Core", idPrefix: "C", color: "#4ade80", templatePath: "" };
const refDef:  ModeDefinition = { id: "ref",  name: "Ref",  folder: "Ref",  idPrefix: "R", color: "#38bdf8", templatePath: "" };
const tempDef: ModeDefinition = { id: "temp", name: "Temp", folder: "Temp", idPrefix: "T", color: "#facc15", templatePath: "" };

const defaultModes = [coreDef, refDef, tempDef];

describe("ModePathStore", () => {
  let store: ModePathStore;

  beforeEach(() => {
    store = new ModePathStore(defaultModes);
  });

  test("初期状態でデフォルトパスが返る", () => {
    expect(store.getPath("core")).toBe("Core/Core.md");
    expect(store.getPath("ref")).toBe("Ref/Ref.md");
    expect(store.getPath("temp")).toBe("Temp/Temp.md");
  });

  test("setPathで更新したパスが返る", () => {
    store.setPath("core", "Core/newNote.md");
    expect(store.getPath("core")).toBe("Core/newNote.md");
  });

  test("あるモードを更新しても他のモードに影響しない", () => {
    store.setPath("core", "Core/newNote.md");
    expect(store.getPath("ref")).toBe("Ref/Ref.md");
    expect(store.getPath("temp")).toBe("Temp/Temp.md");
  });

  test("同じモードを複数回setPathしても最後の値が返る", () => {
    store.setPath("temp", "Temp/a.md");
    store.setPath("temp", "Temp/b.md");
    expect(store.getPath("temp")).toBe("Temp/b.md");
  });
});

describe("ModePathStore - アクティブモード", () => {
  let store: ModePathStore;

  beforeEach(() => {
    store = new ModePathStore(defaultModes);
  });

  test("初期状態のアクティブモードはnull", () => {
    expect(store.getActiveMode()).toBeNull();
  });

  test("setActiveModeで設定したモードが返る", () => {
    store.setActiveMode(coreDef);
    expect(store.getActiveMode()?.id).toBe("core");
  });

  test("setActiveModeで別のモードに切り替えられる", () => {
    store.setActiveMode(coreDef);
    store.setActiveMode(refDef);
    expect(store.getActiveMode()?.id).toBe("ref");
  });

  test("onActiveModeChangeのコールバックがsetActiveMode時に呼ばれる", () => {
    const calls: (string | null)[] = [];
    store.onActiveModeChange((mode) => calls.push(mode?.id ?? null));
    store.setActiveMode(coreDef);
    store.setActiveMode(tempDef);
    expect(calls).toEqual(["core", "temp"]);
  });
});
