import { Plugin } from "obsidian";
import { ModeList } from "./core/modeList";
import { CurrentMode } from "./core/currentMode";
import { ObsidianFileSystem } from "./infra/obsidianFileSystem";
import { createMode } from "./core/createMode";
import { CreateModeModal } from "./ui/createModeModal";

export default class ZkPlugin extends Plugin {
  private modeList = new ModeList();
  private currentMode = new CurrentMode();
  private fs = new ObsidianFileSystem(this.app.vault);

  async onload(): Promise<void> {
    this.addCommand({
      id: "zk-create-mode",
      name: "モードを作成",
      callback: () => {
        new CreateModeModal(this.app, async (input) => {
          const ok = await createMode(
            input.name,
            input.dirPath,
            input.tempPath,
            this.modeList,
            this.fs
          );
          if (!ok) {
            // 同名モードが既に存在する場合
          }
        }).open();
      },
    });
  }
}
