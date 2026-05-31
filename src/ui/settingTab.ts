import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type ZKeyPlugin from "../main";
import { UpsertModeModal } from "./upsertModeModal";
import { getCoreTemplateFolder } from "../infra/obsidianTemplateFolder";

export class ZKeySettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ZKeyPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("モードの自動切り替え")
      .setDesc("ファイルを開いたとき、そのファイルのモードに自動で切り替えます")
      .addToggle((t) => {
        t.setValue(this.plugin.settings.autoSwitchMode)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ autoSwitchMode: v });
          });
      });

    new Setting(containerEl)
      .setName("本文へのzk-origin挿入")
      .setDesc("モード作成時のテンプレートにzk-originのリンクを本文へ挿入します（↑: [[{{zk-origin}}]]）")
      .addToggle((t) => {
        t.setValue(this.plugin.settings.insertOriginInBody)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ insertOriginInBody: v });
          });
      });

    new Setting(containerEl)
      .setName("デフォルトノートフォルダ")
      .setDesc("モード作成時のフォルダパスの初期値に使われます")
      .addText((t) => {
        t.setPlaceholder("Zk")
          .setValue(this.plugin.settings.defaultNoteFolder)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ defaultNoteFolder: v.trim() });
          });
      });

    const templateFolder = getCoreTemplateFolder(this.app);
    const templateEnabled = templateFolder !== null;
    const templateSetting = new Setting(containerEl)
      .setName("テンプレートフォルダ")
      .setDesc(
        templateEnabled
          ? `Obsidian Templates プラグインのフォルダを使用しています: ${templateFolder || "（未設定）"}`
          : "Obsidian Templates プラグインが無効です。コアプラグインから有効にしてください。"
      );
    if (templateEnabled) {
      templateSetting.addButton((btn) => {
        btn.setButtonText("設定を開く").onClick(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.app as any).setting?.openTabById("templates");
        });
      });
    }

    containerEl.createEl("h2", { text: "モード設定" });

    for (const mode of this.plugin.getModes()) {
      const setting = new Setting(containerEl).setName(mode.name);

      if (mode.icon) {
        const iconEl = setting.nameEl.createSpan({ cls: "zkey-mode-icon" });
        iconEl.style.marginRight = "6px";
        setIcon(iconEl, mode.icon);
        setting.nameEl.prepend(iconEl);
      }

      setting.addButton((btn) => {
        setIcon(btn.buttonEl, "settings");
        btn.setTooltip("編集").onClick(() => {
          new UpsertModeModal(this.app, mode, this.plugin.settings.defaultNoteFolder, templateFolder ?? this.plugin.settings.defaultTemplateFolder, async (input) => {
            await this.plugin.upsertModeConfig(mode, input);
            this.display();
          }).open();
        });
      });
    }
  }
}
