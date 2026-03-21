import { describe, test, expect, beforeEach } from 'vitest';
import { Mode } from "../../src/core/mode";
import { ModePathStore } from "../../src/core/modePathStore";

describe("ModePathStore", () => {
  const defaultPaths = {
    Core: "/zk/core",
    Ref: "/zk/ref",
    Temp: "/zk/temp",
  };

  let store: ModePathStore;

  beforeEach(() => {
    store = new ModePathStore(defaultPaths);
  });

  test('初期状態でデフォルトパスが返る', ()=> {
	expect(store.getPath("Core")).toBe("/zk/core");
	expect(store.getPath("Ref")).toBe("/zk/ref");
	expect(store.getPath("Temp")).toBe("/zk/temp");
  });
});
