import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type ZKeyPlugin from "../main";
import { UpsertModeModal } from "./upsertModeModal";
import { getCoreTemplateFolder } from "../infra/obsidianTemplateFolder";
import { i18n } from "../i18n";

export class ZKeySettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ZKeyPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(i18n.settingAutoSwitchName)
      .setDesc(i18n.settingAutoSwitchDesc)
      .addToggle((t) => {
        t.setValue(this.plugin.settings.autoSwitchMode)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ autoSwitchMode: v });
          });
      });

    new Setting(containerEl)
      .setName(i18n.settingInsertOriginName)
      .setDesc(i18n.settingInsertOriginDesc)
      .addToggle((t) => {
        t.setValue(this.plugin.settings.insertOriginInBody)
          .onChange(async (v) => {
            await this.plugin.updateSettings({ insertOriginInBody: v });
          });
      });

    new Setting(containerEl)
      .setName(i18n.settingDefaultFolderName)
      .setDesc(i18n.settingDefaultFolderDesc)
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
      .setName(i18n.settingTemplateFolderName)
      .setDesc(
        templateEnabled
          ? i18n.settingTemplateFolderEnabled(templateFolder || "")
          : i18n.settingTemplateFolderDisabled
      );
    if (templateEnabled) {
      templateSetting.addButton((btn) => {
        btn.setButtonText(i18n.settingOpenSettings).onClick(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.app as any).setting?.openTabById("templates");
        });
      });
    }

    containerEl.createEl("h2", { text: i18n.settingModesHeading });

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
        btn.setTooltip(i18n.settingEditMode).onClick(() => {
          new UpsertModeModal(this.app, mode, this.plugin.settings.defaultNoteFolder, templateFolder ?? this.plugin.settings.defaultTemplateFolder, async (input) => {
            await this.plugin.upsertModeConfig(mode, input);
            this.display();
          }).open();
        });
      });
    }
  }
}
