import { App, PluginSettingTab, Setting } from "obsidian";
import type ZkPlugin from "./main";

export { ZkSettings, DEFAULT_SETTINGS } from "./core/zkSettings";
import type { ZkSettings } from "./core/zkSettings";

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
      .setName("Src ルートノートのパス")
      .setDesc("Srcノート（参考文献）のルートノート（vault内の相対パス）")
      .addText((text) =>
        text
          .setPlaceholder("Src/Src.md")
          .setValue(this.plugin.settings.srcRootPath)
          .onChange(async (value) => {
            this.plugin.settings.srcRootPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Book Search コマンドID")
      .setDesc("新規Srcノート作成に使用するBook SearchプラグインのコマンドID")
      .addText((text) =>
        text
          .setPlaceholder("obsidian-book-search-plugin:open-book-search-dialog")
          .setValue(this.plugin.settings.bookSearchCommandId)
          .onChange(async (value) => {
            this.plugin.settings.bookSearchCommandId = value;
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

    // --- テンプレート ---
    containerEl.createEl("h3", { text: "ノートテンプレート" });
    containerEl.createEl("p", { text: "指定ファイルが存在しない場合、初回作成時にデフォルトテンプレートを自動生成します。" });

    new Setting(containerEl)
      .setName("Coreノート テンプレートパス")
      .addText((text) =>
        text
          .setPlaceholder("Meta/Template/zk-core-note.md")
          .setValue(this.plugin.settings.coreNoteTemplatePath)
          .onChange(async (value) => {
            this.plugin.settings.coreNoteTemplatePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Refノート テンプレートパス")
      .addText((text) =>
        text
          .setPlaceholder("Meta/Template/zk-ref-note.md")
          .setValue(this.plugin.settings.refNoteTemplatePath)
          .onChange(async (value) => {
            this.plugin.settings.refNoteTemplatePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("CoreRoot テンプレートパス")
      .addText((text) =>
        text
          .setPlaceholder("Meta/Template/zk-core-root.md")
          .setValue(this.plugin.settings.coreRootTemplatePath)
          .onChange(async (value) => {
            this.plugin.settings.coreRootTemplatePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("RefRoot テンプレートパス")
      .addText((text) =>
        text
          .setPlaceholder("Meta/Template/zk-ref-root.md")
          .setValue(this.plugin.settings.refRootTemplatePath)
          .onChange(async (value) => {
            this.plugin.settings.refRootTemplatePath = value;
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
