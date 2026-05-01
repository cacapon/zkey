import { describe, it, expect, beforeEach } from "vitest";
import { ModeList } from "../../src/core/modeList";
import { Mode } from "../../src/core/mode";

const makeMode = (name: string): Mode => ({
  name,
  dirPath: `/notes/${name}`,
  tempPath: `/templates/${name}.md`,
  currPath: `/notes/${name}/root.md`,
});

describe("ModeList", () => {
  let modeList: ModeList;

  beforeEach(() => {
    modeList = new ModeList();
  });

  describe("addMode", () => {
    it("新しいモードを追加するとtrueを返す", () => {
      expect(modeList.addMode(makeMode("Core"))).toBe(true);
    });

    it("同名のモードを追加するとfalseを返す", () => {
      modeList.addMode(makeMode("Core"));
      expect(modeList.addMode(makeMode("Core"))).toBe(false);
    });

    it("追加したモードがgetModesに含まれる", () => {
      modeList.addMode(makeMode("Core"));
      expect(modeList.getModes().map((m) => m.name)).toContain("Core");
    });
  });

  describe("deleteMode", () => {
    it("存在するモードを削除するとtrueを返す", () => {
      modeList.addMode(makeMode("Core"));
      expect(modeList.deleteMode(makeMode("Core"))).toBe(true);
    });

    it("存在しないモードを削除するとfalseを返す", () => {
      expect(modeList.deleteMode(makeMode("Core"))).toBe(false);
    });

    it("削除後はgetModesに含まれない", () => {
      modeList.addMode(makeMode("Core"));
      modeList.deleteMode(makeMode("Core"));
      expect(modeList.getModes().map((m) => m.name)).not.toContain("Core");
    });
  });

  describe("getModes", () => {
    it("コピーを返すので外部から変更しても内部に影響しない", () => {
      modeList.addMode(makeMode("Core"));
      const modes = modeList.getModes();
      modes.pop();
      expect(modeList.getModes()).toHaveLength(1);
    });
  });

  describe("updateMode", () => {
    it("同名モードのプロパティを更新できる", () => {
      modeList.addMode(makeMode("Core"));
      const updated: Mode = {
        name: "Core",
        dirPath: "/new/path",
        tempPath: "/new/template.md",
        currPath: "/new/path/root.md",
      };
      modeList.updateMode(updated);
      expect(modeList.getModes()[0].dirPath).toBe("/new/path");
    });

    it("存在しない名前では何も変わらない", () => {
      modeList.addMode(makeMode("Core"));
      modeList.updateMode(makeMode("Temp"));
      expect(modeList.getModes()).toHaveLength(1);
    });
  });
});
