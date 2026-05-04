import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type ZkPlugin from "../main";
import { EditModeModal } from "./editModeModal";

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

    new Setting(containerEl)
      .setName("デフォルトテンプレートフォルダ")
      .setDesc("モード作成時のテンプレートパスの初期値に使われます")
      .addText((t) => {
        t.setPlaceholder("Templates")
          .setValue(this.plugin.settings.defaultTemplateFolder)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ defaultTemplateFolder: v.trim() });
          });
      });

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
          new EditModeModal(this.app, mode, async (input) => {
            if (input.name !== mode.name) {
              await this.plugin.renameModeConfig(mode.name, input.name);
            }
            await this.plugin.updateModeConfig(input.name, { icon: input.icon, prefix: input.prefix });
            this.display();
          }).open();
        });
      });
    }
  }
}
