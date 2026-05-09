import { App, Modal, Setting, TextComponent, setIcon } from "obsidian";
import { IconPickerModal } from "./iconPickerModal";
import { FileSuggest } from "./fileSuggest";

export interface CreateModeInput {
  name: string;
  rootPath: string;
  tempPath: string;
  prefix: string;
  icon: string;
}

export class CreateModeModal extends Modal {
  private name = "";
  private rootPath = "";
  private tempPath = "";
  private prefix = "";
  private icon = "lucide-notepad-text";
  private rootPathManuallyChanged = false;
  private tempPathManuallyChanged = false;

  constructor(
    app: App,
    private defaultNoteFolder: string,
    private defaultTemplateFolder: string,
    private onSubmit: (input: CreateModeInput) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "新しいモードを作成" });

    const errorEl = contentEl.createEl("p");
    errorEl.style.color = "var(--text-error)";
    errorEl.style.display = "none";

    const submit = () => {
      if (!this.name) {
        errorEl.setText("モード名を入力してください");
        errorEl.style.display = "";
        return;
      }

      const rawRootPath = this.rootPath || `${this.defaultNoteFolder}/${this.name}/${this.name}Root.md`;
      const rootPath = rawRootPath.endsWith(".md") ? rawRootPath : `${rawRootPath}.md`;
      const rawTempPath = this.tempPath || `${this.defaultTemplateFolder}/${this.name}Template.md`;
      const tempPath = rawTempPath.endsWith(".md") ? rawTempPath : `${rawTempPath}.md`;

      this.close();
      this.onSubmit({ name: this.name, rootPath, tempPath, prefix: this.prefix, icon: this.icon });
    };

    let rootText: TextComponent;
    let tempText: TextComponent;

    new Setting(contentEl)
      .setName("モード名")
      .setDesc("表示名（例: Core, Temp）")
      .addButton((btn) => {
        btn.setTooltip("アイコンを選択").onClick(() => {
          new IconPickerModal(this.app, (iconId) => {
            this.icon = iconId;
            btn.buttonEl.empty();
            if (iconId) {
              setIcon(btn.buttonEl, iconId);
            } else {
              btn.buttonEl.setText("(なし)");
            }
          }).open();
        });
        setIcon(btn.buttonEl, "lucide-notepad-text");
      })
      .addText((t) => {
        t.setPlaceholder("Core").onChange((v) => {
          this.name = v.trim();
          if (!this.rootPathManuallyChanged) {
            const autoRoot = `${this.defaultNoteFolder}/${this.name}/${this.name}Root.md`;
            this.rootPath = autoRoot;
            rootText.setValue(autoRoot);
          }
          if (!this.tempPathManuallyChanged) {
            const autoTemp = `${this.defaultTemplateFolder}/${this.name}Template.md`;
            this.tempPath = autoTemp;
            tempText.setValue(autoTemp);
          }
        });
        t.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); }
        });
      });

    new Setting(contentEl)
      .setName("IDプレフィックス")
      .setDesc("ノートIDの先頭に付ける文字（例: C → Ca3f9x2...）。空欄でも可。")
      .addText((t) => {
        t.setPlaceholder("C").onChange((v) => { this.prefix = v.trim(); });
      });

    const rootSetting = new Setting(contentEl)
      .setName("ルートノートパス")
      .setDesc("モードの起点となるノート。フォルダパスはここから自動設定されます。")
      .addText((t) => {
        rootText = t;
        t.inputEl.style.width = "100%";
        t.setValue(`${this.defaultNoteFolder}/`).onChange((v) => {
          this.rootPath = v.trim();
          this.rootPathManuallyChanged = true;
        });
      });
    rootSetting.settingEl.style.flexWrap = "wrap";
    rootSetting.controlEl.style.width = "100%";

    const tempSetting = new Setting(contentEl)
      .setName("テンプレートパス")
      .setDesc("新規ノート作成時に使うテンプレートファイル")
      .addText((t) => {
        tempText = t;
        t.inputEl.style.width = "100%";
        t.setValue(`${this.defaultTemplateFolder}/`).onChange((v) => {
          this.tempPath = v.trim();
          this.tempPathManuallyChanged = true;
        });
        if (this.defaultTemplateFolder) {
          new FileSuggest(this.app, t.inputEl, this.defaultTemplateFolder);
        }
      });
    tempSetting.settingEl.style.flexWrap = "wrap";
    tempSetting.controlEl.style.width = "100%";

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });

    btnRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => {
      this.close();
    });

    btnRow.createEl("button", { text: "作成", cls: "mod-cta" }).addEventListener("click", submit);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
