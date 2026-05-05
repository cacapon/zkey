import { App, Modal, Setting, TextComponent, setIcon } from "obsidian";
import { IconPickerModal } from "./iconPickerModal";
import { FileSuggest } from "./fileSuggest";

export interface CreateModeInput {
  name: string;
  dirPath: string;
  tempPath: string;
  prefix: string;
  icon: string;
}

export class CreateModeModal extends Modal {
  private name = "";
  private dirPath = "";
  private tempPath = "";
  private prefix = "";
  private icon = "lucide-notepad-text";
  private dirPathManuallyChanged = false;
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

      const dirPath = this.dirPath || this.name;
      const rawTempPath = this.tempPath || `${this.defaultTemplateFolder}/${this.name}.md`;
      const tempPath = rawTempPath.endsWith(".md") ? rawTempPath : `${rawTempPath}.md`;

      this.close();
      this.onSubmit({ name: this.name, dirPath, tempPath, prefix: this.prefix, icon: this.icon });
    };

    let dirText: TextComponent;
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
          if (!this.dirPathManuallyChanged) {
            const autoDir = `${this.defaultNoteFolder}/${this.name}`;
            this.dirPath = autoDir;
            dirText.setValue(autoDir);
          }
          if (!this.tempPathManuallyChanged) {
            const autoTemp = `${this.defaultTemplateFolder}/${this.name}.md`;
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

    new Setting(contentEl)
      .setName("フォルダパス")
      .setDesc("ノートを保存するフォルダ")
      .addText((t) => {
        dirText = t;
        t.setValue(`${this.defaultNoteFolder}/`).onChange((v) => {
          this.dirPath = v.trim();
          this.dirPathManuallyChanged = true;
        });
      });

    new Setting(contentEl)
      .setName("テンプレートパス")
      .setDesc("新規ノート作成時に使うテンプレートファイル")
      .addText((t) => {
        tempText = t;
        t.setValue(`${this.defaultTemplateFolder}/`).onChange((v) => {
          this.tempPath = v.trim();
          this.tempPathManuallyChanged = true;
        });
        if (this.defaultTemplateFolder) {
          new FileSuggest(this.app, t.inputEl, this.defaultTemplateFolder);
        }
      });

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
