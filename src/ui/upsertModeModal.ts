import { App, Modal, Setting, TextComponent, setIcon } from "obsidian";
import { Mode } from "../core/mode";
import { ModeInput } from "../core/upsertMode";
import { IconPickerModal } from "./iconPickerModal";
import { FileSuggest } from "./fileSuggest";
import { i18n } from "../i18n";

export class UpsertModeModal extends Modal {
  private name: string;
  private rootPath: string;
  private tempPath: string;
  private prefix: string;
  private icon: string;
  private nameManuallyChanged = false;

  constructor(
    app: App,
    private existingMode: Mode | null,
    private defaultNoteFolder: string,
    private defaultTemplateFolder: string,
    private onSubmit: (input: ModeInput) => void
  ) {
    super(app);
    this.name = existingMode?.name ?? "";
    this.rootPath = existingMode?.rootPath ?? "";
    this.tempPath = existingMode?.tempPath ?? "";
    this.prefix = existingMode?.prefix ?? "";
    this.icon = existingMode?.icon ?? "lucide-notepad-text";
  }

  onOpen(): void {
    const { contentEl } = this;
    const isEdit = this.existingMode !== null;
    contentEl.createEl("h2", { text: isEdit ? i18n.editModeTitle(this.existingMode!.name) : i18n.createModeTitle });

    const errorEl = contentEl.createEl("p");
    errorEl.style.color = "var(--text-error)";
    errorEl.style.display = "none";

    const submit = () => {
      if (!this.name) {
        errorEl.setText(i18n.modeNameRequired);
        errorEl.style.display = "";
        return;
      }
      const rawRoot = this.rootPath || `${this.defaultNoteFolder}/${this.name}/${this.name}Root.md`;
      const rootPath = rawRoot.endsWith(".md") ? rawRoot : `${rawRoot}.md`;
      const rawTemp = this.tempPath || `${this.defaultTemplateFolder}/${this.name}Template.md`;
      const tempPath = rawTemp.endsWith(".md") ? rawTemp : `${rawTemp}.md`;
      this.close();
      this.onSubmit({ name: this.name, rootPath, tempPath, prefix: this.prefix, icon: this.icon });
    };

    let rootText: TextComponent;
    let tempText: TextComponent;

    const updatePaths = (name: string) => {
      const autoRoot = `${this.defaultNoteFolder}/${name}/${name}Root.md`;
      const autoTemp = `${this.defaultTemplateFolder}/${name}Template.md`;
      this.rootPath = autoRoot;
      this.tempPath = autoTemp;
      rootText.setValue(autoRoot);
      tempText.setValue(autoTemp);
    };

    new Setting(contentEl)
      .setName(i18n.fieldModeName)
      .setDesc(i18n.fieldModeNameDesc)
      .addButton((btn) => {
        btn.setTooltip(i18n.fieldSelectIcon).onClick(() => {
          new IconPickerModal(this.app, (iconId) => {
            this.icon = iconId;
            btn.buttonEl.empty();
            if (iconId) setIcon(btn.buttonEl, iconId);
            else btn.buttonEl.setText(i18n.noIcon);
          }).open();
        });
        if (this.icon) setIcon(btn.buttonEl, this.icon);
        else btn.buttonEl.setText(i18n.noIcon);
      })
      .addText((t) => {
        t.setValue(this.name).onChange((v) => {
          this.name = v.trim();
          this.nameManuallyChanged = true;
          updatePaths(this.name);
        });
        t.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); }
        });
      });

    new Setting(contentEl)
      .setName(i18n.fieldIdPrefix)
      .setDesc(i18n.fieldIdPrefixDesc)
      .addText((t) => {
        t.setValue(this.prefix).onChange((v) => { this.prefix = v.trim(); });
      });

    const rootSetting = new Setting(contentEl)
      .setName(i18n.fieldRootPath)
      .setDesc(i18n.fieldRootPathDesc)
      .addText((t) => {
        rootText = t;
        t.inputEl.style.width = "100%";
        t.setValue(this.rootPath || `${this.defaultNoteFolder}/`).onChange((v) => {
          if (!this.nameManuallyChanged) this.rootPath = v.trim();
        });
      });
    rootSetting.settingEl.style.flexWrap = "wrap";
    rootSetting.controlEl.style.width = "100%";

    const tempSetting = new Setting(contentEl)
      .setName(i18n.fieldTemplatePath)
      .setDesc(i18n.fieldTemplatePathDesc)
      .addText((t) => {
        tempText = t;
        t.inputEl.style.width = "100%";
        t.setValue(this.tempPath || `${this.defaultTemplateFolder}/`).onChange((v) => {
          if (!this.nameManuallyChanged) this.tempPath = v.trim();
        });
        if (this.defaultTemplateFolder) {
          new FileSuggest(this.app, t.inputEl, this.defaultTemplateFolder);
        }
      });
    tempSetting.settingEl.style.flexWrap = "wrap";
    tempSetting.controlEl.style.width = "100%";

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    btnRow.createEl("button", { text: i18n.btnCancel }).addEventListener("click", () => { this.close(); });
    btnRow.createEl("button", { text: isEdit ? i18n.btnSave : i18n.btnCreate, cls: "mod-cta" }).addEventListener("click", submit);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
