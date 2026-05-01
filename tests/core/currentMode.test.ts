import { describe, it, expect, beforeEach } from "vitest";
import { CurrentMode } from "../../src/core/currentMode";
import { Mode } from "../../src/core/mode";

const makeMode = (name: string): Mode => ({
  name,
  dirPath: `/notes/${name}`,
  tempPath: `/templates/${name}.md`,
  currPath: `/notes/${name}/root.md`,
});

describe("CurrentMode", () => {
  let currentMode: CurrentMode;

  beforeEach(() => {
    currentMode = new CurrentMode();
  });

  it("初期状態はnullを返す", () => {
    expect(currentMode.getMode()).toBeNull();
  });

  it("setModeで設定したモードをgetModeで取得できる", () => {
    currentMode.setMode(makeMode("Core"));
    expect(currentMode.getMode()?.name).toBe("Core");
  });

  it("setModeを上書きすると新しいモードが返る", () => {
    currentMode.setMode(makeMode("Core"));
    currentMode.setMode(makeMode("Temp"));
    expect(currentMode.getMode()?.name).toBe("Temp");
  });
});
