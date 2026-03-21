import { Plugin } from "obsidian";
import { ZkSettings, DEFAULT_SETTINGS, ZkSettingTab } from "./settings";

export default class ZkPlugin extends Plugin {
  settings!: ZkSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ZkSettingTab(this.app, this));

    // TODO: Core モードコマンド登録
    // TODO: Ref モードコマンド登録
    // TODO: Temp モードコマンド登録
    // TODO: バックリンク自動更新（on-save hook）
    // TODO: 腐敗検知

    console.log("Zk plugin loaded");
  }

  onunload() {
    console.log("Zk plugin unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
