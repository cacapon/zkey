import { App, PluginSettingTab, Setting } from "obsidian";
import type ZkPlugin from "./main";
import { FolderSuggest } from "./ui/folderSuggest";

export { ZkSettings, DEFAULT_SETTINGS } from "./core/zkSettings";

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

    // --- モード一覧 ---
    containerEl.createEl("h3", { text: "モード" });

    const { modes } = this.plugin.settings;

    if (modes.length === 0) {
      containerEl.createEl("p", {
        text: "モードがありません。コマンドパレットから「モードを作成する」を実行してください。",
      });
    } else {
      for (const mode of modes) {
        new Setting(containerEl)
          .setName(mode.name)
          .setDesc(
            `フォルダ: ${mode.folder}  |  IDプレフィックス: ${mode.idPrefix}  |  テンプレート: ${mode.templatePath}`
          )
          .addColorPicker((cp) => {
            cp.setValue(mode.color).onChange(async (value) => {
              mode.color = value;
              await this.plugin.saveSettings();
            });
          })
          .addExtraButton((btn) => {
            btn.setIcon("trash").setTooltip("このモードを削除").onClick(async () => {
              // 設定からのみ削除（ファイル削除はdeleteModeコマンドで）
              this.plugin.settings.modes = this.plugin.settings.modes.filter(
                (m) => m.id !== mode.id
              );
              await this.plugin.saveSettings();
              this.plugin.modePathStore.updateModes(this.plugin.settings.modes);
              this.display();
            });
          });
      }
    }

    // --- モード作成のデフォルト ---
    containerEl.createEl("h3", { text: "モード作成のデフォルト設定" });

    new Setting(containerEl)
      .setName("デフォルトのモードフォルダ")
      .setDesc("モード作成時にフォルダを配置する親フォルダ（空欄でvaultルート）")
      .addText((text) => {
        text
          .setPlaceholder("例: Notes")
          .setValue(this.plugin.settings.defaultModeFolder)
          .onChange(async (value) => {
            this.plugin.settings.defaultModeFolder = value.trim();
            await this.plugin.saveSettings();
          });
        new FolderSuggest(this.app, text.inputEl);
      });

    new Setting(containerEl)
      .setName("デフォルトのテンプレートフォルダ")
      .setDesc("モード作成時にテンプレートを配置するフォルダ")
      .addText((text) => {
        text
          .setPlaceholder("Meta/Template")
          .setValue(this.plugin.settings.defaultTemplateFolder)
          .onChange(async (value) => {
            this.plugin.settings.defaultTemplateFolder = value.trim();
            await this.plugin.saveSettings();
          });
        new FolderSuggest(this.app, text.inputEl);
      });

    // --- バックリンク ---
    containerEl.createEl("h3", { text: "バックリンク" });

    new Setting(containerEl)
      .setName("バックリンク自動更新")
      .setDesc("ファイルを開いたときにバックリンクセクションを自動更新します")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableBacklinks)
          .onChange(async (value) => {
            this.plugin.settings.enableBacklinks = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exclude path glob patterns")
      .setDesc("バックリンクの対象外にするパスのglobパターン（1行1パターン）")
      .addTextArea((text) => {
        text
          .setPlaceholder("Meta/Template/**\n**/attachments")
          .setValue(this.plugin.settings.backlinkExcludePatterns.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.backlinkExcludePatterns = value
              .split("\n")
              .map((p) => p.trim())
              .filter((p) => p.length > 0);
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 5;
        text.inputEl.style.width = "100%";
      });

    // --- ID生成 ---
    containerEl.createEl("h3", { text: "ID生成" });

    new Setting(containerEl)
      .setName("ID長")
      .setDesc("プレフィックスを除いたIDのランダム文字数（デフォルト: 15）")
      .addText((text) =>
        text
          .setPlaceholder("15")
          .setValue(String(this.plugin.settings.idLen))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.idLen = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("エイリアス最小長")
      .setDesc("エイリアスの最短文字数（デフォルト: 4）")
      .addText((text) =>
        text
          .setPlaceholder("4")
          .setValue(String(this.plugin.settings.aliasMinLen))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.aliasMinLen = num;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
