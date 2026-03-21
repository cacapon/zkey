import { Plugin } from "obsidian";
import { ZkSettings, DEFAULT_SETTINGS, ZkSettingTab } from "./settings";
import { ModePathStore } from "./core/modePathStore";
import { selectModeCommand } from "./commands/selectMode";

export default class ZkPlugin extends Plugin {
  settings!: ZkSettings;
  modePathStore!: ModePathStore;

  async onload() {
    await this.loadSettings();

    this.modePathStore = new ModePathStore({
      Core: this.settings.coreRootPath,
      Ref:  this.settings.refRootPath,
      Temp: this.settings.tempRootPath,
    });

    this.addSettingTab(new ZkSettingTab(this.app, this));

    this.addCommand({
      id: "select-mode",
      name: "モードを選択する",
      callback: () => {
        selectModeCommand(this.app, this.modePathStore, this.settings);
      },
    });

    // TODO: Coreモードコマンド登録
    // TODO: Refモードコマンド登録
    // TODO: Tempモードコマンド登録
    // TODO: バックリンク自動更新（on-save hook）
    // TODO: 腐敗検知
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
