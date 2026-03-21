import { App, PluginSettingTab, Setting } from "obsidian";
import type ZkPlugin from "./main";

export interface ZkSettings {
  coreRootPath: string;
  refRootPath: string;
  tempRootPath: string;
  enableBacklinks: boolean;
  enableDecayDetection: boolean;
  decayDays: number;
}

export const DEFAULT_SETTINGS: ZkSettings = {
  coreRootPath: "Core/Core.md",
  refRootPath: "Ref/Ref.md",
  tempRootPath: "Temp/Temp.md",
  enableBacklinks: true,
  enableDecayDetection: true,
  decayDays: 14,
};

export class ZkSettingTab extends PluginSettingTab {
  plugin: ZkPlugin;

  constructor(app: App, plugin: ZkPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Zk 設定" });

    // --- モードのルートパス ---
    containerEl.createEl("h3", { text: "モードのルートノート" });

    new Setting(containerEl)
      .setName("Core ルートノートのパス")
      .setDesc("Coreモードのルートノート（vault内の相対パス）")
      .addText((text) =>
        text
          .setPlaceholder("Core/Core.md")
          .setValue(this.plugin.settings.coreRootPath)
          .onChange(async (value) => {
            this.plugin.settings.coreRootPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ref ルートノートのパス")
      .setDesc("Refモードのルートノート（vault内の相対パス）")
      .addText((text) =>
        text
          .setPlaceholder("Ref/Ref.md")
          .setValue(this.plugin.settings.refRootPath)
          .onChange(async (value) => {
            this.plugin.settings.refRootPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Temp ルートノートのパス")
      .setDesc("Tempモードのルートノート（vault内の相対パス）")
      .addText((text) =>
        text
          .setPlaceholder("Temp/Temp.md")
          .setValue(this.plugin.settings.tempRootPath)
          .onChange(async (value) => {
            this.plugin.settings.tempRootPath = value;
            await this.plugin.saveSettings();
          })
      );

    // --- バックリンク ---
    containerEl.createEl("h3", { text: "バックリンク" });

    new Setting(containerEl)
      .setName("バックリンク自動更新")
      .setDesc("保存時にノート本文のバックリンクセクションを自動更新します")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableBacklinks)
          .onChange(async (value) => {
            this.plugin.settings.enableBacklinks = value;
            await this.plugin.saveSettings();
          })
      );

    // --- 腐敗検知 ---
    containerEl.createEl("h3", { text: "Tempノート 腐敗検知" });

    new Setting(containerEl)
      .setName("腐敗検知を有効にする")
      .setDesc("一定期間更新されていないTempノートを検出します")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDecayDetection)
          .onChange(async (value) => {
            this.plugin.settings.enableDecayDetection = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("腐敗判定日数")
      .setDesc("最終更新から何日経過したら腐敗とみなすか（デフォルト: 14日）")
      .addText((text) =>
        text
          .setPlaceholder("14")
          .setValue(String(this.plugin.settings.decayDays))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.decayDays = num;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
