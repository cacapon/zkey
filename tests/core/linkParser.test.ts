import { describe, it, expect } from "vitest";
import { parseLinkAtCursor, extractLinks } from "../../src/core/linkParser";

describe("parseLinkAtCursor", () => {
  it("カーソルがリンク内にある場合リンク先名を返す", () => {
    const line = "これは [[Core]] のノートです";
    expect(parseLinkAtCursor(line, 9)).toBe("Core");
  });

  it("カーソルが [[ の直後にある場合もリンク先名を返す", () => {
    const line = "[[Core]]";
    expect(parseLinkAtCursor(line, 2)).toBe("Core");
  });

  it("カーソルが ]] の直前にある場合もリンク先名を返す", () => {
    const line = "[[Core]]";
    expect(parseLinkAtCursor(line, 7)).toBe("Core");
  });

  it("カーソルがリンク外にある場合nullを返す", () => {
    const line = "これは [[Core]] のノートです";
    expect(parseLinkAtCursor(line, 3)).toBeNull();
  });

  it("複数リンクがある場合カーソル位置のリンクを返す", () => {
    const line = "[[Foo]] と [[Bar]] を参照";
    expect(parseLinkAtCursor(line, 12)).toBe("Bar");
  });

  it("エイリアス付きリンク([[Name|Alias]])はリンク先名を返す", () => {
    const line = "[[Core|コア]]";
    expect(parseLinkAtCursor(line, 5)).toBe("Core");
  });

  it("リンクがない行はnullを返す", () => {
    expect(parseLinkAtCursor("普通のテキスト", 3)).toBeNull();
  });

  it("空行はnullを返す", () => {
    expect(parseLinkAtCursor("", 0)).toBeNull();
  });

  it("リンク名の前後の空白はtrimされる", () => {
    const line = "[[ Core ]]";
    expect(parseLinkAtCursor(line, 4)).toBe("Core");
  });

  it("テーブル内の\\|エスケープ付きエイリアスリンクはリンク先名を返す", () => {
    const line = "| [[zk/common/TODO\\|TODO]] | 説明 |";
    expect(parseLinkAtCursor(line, 5)).toBe("zk/common/TODO");
  });
});

describe("extractLinks", () => {
  it("本文中の[[リンク]]を全て抽出する", () => {
    const content = "[[Foo]] と [[Bar]] を参照";
    expect(extractLinks(content)).toEqual(["Foo", "Bar"]);
  });

  it("エイリアス付きリンクはリンク先名を返す", () => {
    const content = "[[Core|コア]] と [[Temp|一時]]";
    expect(extractLinks(content)).toEqual(["Core", "Temp"]);
  });

  it("リンクがない場合は空配列を返す", () => {
    expect(extractLinks("ただのテキスト")).toEqual([]);
  });

  it("フロントマターのzk-originもリンクとして抽出される", () => {
    const content = '---\nzk-origin: "[[Core]]"\n---\n\n本文 [[Note]]';
    expect(extractLinks(content)).toEqual(["Core", "Note"]);
  });

  it("同じリンクが複数あっても全て返す", () => {
    const content = "[[Core]] と [[Core]] を参照";
    expect(extractLinks(content)).toEqual(["Core", "Core"]);
  });

  it("リンク名の前後の空白はtrimされる", () => {
    const content = "[[ Core ]]";
    expect(extractLinks(content)).toEqual(["Core"]);
  });

  it("空文字列は空配列を返す", () => {
    expect(extractLinks("")).toEqual([]);
  });
});
