import { App, Modal, Setting, setIcon } from "obsidian";
import { Mode } from "../core/mode";
import { IconPickerModal } from "./iconPickerModal";
import { FileSuggest } from "./fileSuggest";

export interface EditModeInput {
  name: string;
  prefix: string;
  icon: string;
  tempPath: string;
}

export class EditModeModal extends Modal {
  private name: string;
  private prefix: string;
  private icon: string;
  private tempPath: string;

  constructor(
    app: App,
    private mode: Mode,
    private templateFolderPath: string | null,
    private onSubmit: (input: EditModeInput) => void
  ) {
    super(app);
    this.name = mode.name;
    this.prefix = mode.prefix ?? "";
    this.icon = mode.icon ?? "";
    this.tempPath = mode.tempPath;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `「${this.mode.name}」を編集` });

    const errorEl = contentEl.createEl("p");
    errorEl.style.color = "var(--text-error)";
    errorEl.style.display = "none";

    const submit = () => {
      if (!this.name) {
        errorEl.setText("モード名を入力してください");
        errorEl.style.display = "";
        return;
      }
      this.close();
      this.onSubmit({ name: this.name, prefix: this.prefix, icon: this.icon, tempPath: this.tempPath });
    };

    new Setting(contentEl)
      .setName("モード名")
      .addButton((btn) => {
        if (this.icon) setIcon(btn.buttonEl, this.icon);
        else btn.buttonEl.setText("(なし)");
        btn.setTooltip("アイコンを選択").onClick(() => {
          new IconPickerModal(this.app, (iconId) => {
            this.icon = iconId;
            btn.buttonEl.empty();
            if (iconId) setIcon(btn.buttonEl, iconId);
            else btn.buttonEl.setText("(なし)");
          }).open();
        });
      })
      .addText((t) => {
        t.setValue(this.mode.name).onChange((v) => { this.name = v.trim(); });
        t.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); }
        });
      });

    new Setting(contentEl)
      .setName("テンプレートパス")
      .setDesc("新規ノート作成時に使うテンプレートファイル")
      .addText((t) => {
        t.setValue(this.tempPath).onChange((v) => { this.tempPath = v.trim(); });
        if (this.templateFolderPath) {
          new FileSuggest(this.app, t.inputEl, this.templateFolderPath);
        }
      });

    new Setting(contentEl)
      .setName("IDプレフィックス")
      .setDesc("ノートIDの先頭に付ける文字（例: C → Ca3f9x2...）。空欄でも可。")
      .addText((t) => {
        t.setValue(this.prefix).onChange((v) => { this.prefix = v.trim(); });
      });

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    btnRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => { this.close(); });
    btnRow.createEl("button", { text: "保存", cls: "mod-cta" }).addEventListener("click", submit);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
