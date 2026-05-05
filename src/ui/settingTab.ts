import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type ZkPlugin from "../main";
import { EditModeModal } from "./editModeModal";
import { getCoreTemplateFolder } from "../infra/obsidianTemplateFolder";

export class ZkSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ZkPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

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
        const iconEl = setting.nameEl.createSpan({ cls: "zk-mode-icon" });
        iconEl.style.marginRight = "6px";
        setIcon(iconEl, mode.icon);
        setting.nameEl.prepend(iconEl);
      }

      setting.addButton((btn) => {
        setIcon(btn.buttonEl, "settings");
        btn.setTooltip("編集").onClick(() => {
          new EditModeModal(this.app, mode, templateFolder, async (input) => {
            if (input.name !== mode.name) {
              await this.plugin.renameModeConfig(mode.name, input.name);
            }
            await this.plugin.updateModeConfig(input.name, { icon: input.icon, prefix: input.prefix, tempPath: input.tempPath });
            this.display();
          }).open();
        });
      });
    }
  }
}
