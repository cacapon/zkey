import { App, Modal } from "obsidian";

export class ConfirmModal extends Modal {
  private message: string;
  private onConfirm: () => void;

  constructor(app: App, message: string, onConfirm: () => void) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });

    const buttonRow = contentEl.createDiv({ cls: "modal-button-container" });

    buttonRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => {
      this.close();
    });

    const confirmBtn = buttonRow.createEl("button", {
      text: "実行",
      cls: "mod-warning",
    });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
