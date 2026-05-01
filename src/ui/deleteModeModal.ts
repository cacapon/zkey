import { App, Modal, Setting } from "obsidian";
import { ModeDefinition } from "../core/zkSettings";

export class DeleteModeModal extends Modal {
  private mode: ModeDefinition;
  private onConfirm: (deleteFiles: boolean) => void;
  private deleteFiles = false;

  constructor(app: App, mode: ModeDefinition, onConfirm: (deleteFiles: boolean) => void) {
    super(app);
    this.mode = mode;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `モード "${this.mode.name}" を削除` });
    contentEl.createEl("p", { text: "設定からモードを削除します。ノートはそのまま残ります。" });

    new Setting(contentEl)
      .setName("テンプレートとフォルダも削除する")
      .setDesc(`"${this.mode.templatePath}" と "${this.mode.folder}/" フォルダをゴミ箱に移動します`)
      .addToggle((t) => {
        t.setValue(false).onChange((v) => {
          this.deleteFiles = v;
        });
      });

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });

    btnRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => {
      this.close();
    });

    const confirmBtn = btnRow.createEl("button", { text: "削除", cls: "mod-warning" });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm(this.deleteFiles);
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
