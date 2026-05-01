import { describe, it, expect, beforeEach } from "vitest";
import { deleteMode } from "../../src/core/deleteMode";
import { ModeList } from "../../src/core/modeList";
import { CurrentMode } from "../../src/core/currentMode";
import { Mode } from "../../src/core/mode";

const makeMode = (name: string): Mode => ({
  name,
  dirPath: `/notes/${name}`,
  tempPath: `/templates/${name}.md`,
  currPath: `/notes/${name}/root.md`,
});

describe("deleteMode", () => {
  let modeList: ModeList;
  let currentMode: CurrentMode;

  beforeEach(() => {
    modeList = new ModeList();
    currentMode = new CurrentMode();
  });

  it("存在するモードを削除するとtrueを返す", () => {
    modeList.addMode(makeMode("Core"));
    expect(deleteMode(makeMode("Core"), modeList, currentMode)).toBe(true);
  });

  it("存在しないモードを削除するとfalseを返す", () => {
    expect(deleteMode(makeMode("Core"), modeList, currentMode)).toBe(false);
  });

  it("削除後はModeListに含まれない", () => {
    modeList.addMode(makeMode("Core"));
    deleteMode(makeMode("Core"), modeList, currentMode);
    expect(modeList.getModes().map((m) => m.name)).not.toContain("Core");
  });

  it("削除したモードがCurrentModeに設定されていた場合はnullになる", () => {
    modeList.addMode(makeMode("Core"));
    currentMode.setMode(makeMode("Core"));
    deleteMode(makeMode("Core"), modeList, currentMode);
    expect(currentMode.getMode()).toBeNull();
  });

  it("削除したモードと別のモードがCurrentModeに設定されていた場合はそのまま", () => {
    modeList.addMode(makeMode("Core"));
    currentMode.setMode(makeMode("Temp"));
    deleteMode(makeMode("Core"), modeList, currentMode);
    expect(currentMode.getMode()?.name).toBe("Temp");
  });
});
