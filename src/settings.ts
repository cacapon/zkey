import { App, PluginSettingTab, Setting } from "obsidian";
import type ZkPlugin from "./main";

export interface ZkSettings {
  enableBacklinks: boolean;
  enableDecayDetection: boolean;
  decayDays: number;
  hotkeyCoreMode: string;
  hotkeyRefMode: string;
  hotkeyTempMode: string;
}

export const DEFAULT_SETTINGS: ZkSettings = {
  enableBacklinks: true,
  enableDecayDetection: true,
  decayDays: 14,
  hotkeyCoreMode: "",
  hotkeyRefMode: "",
  hotkeyTempMode: "",
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
