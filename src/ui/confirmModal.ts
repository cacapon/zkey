import { App, Modal, Setting } from "obsidian";
import { i18n } from "../i18n";

export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText(i18n.btnCancel).onClick(() => {
          this.close();
        });
      })
      .addButton((btn) => {
        btn.setButtonText(i18n.btnDelete).setCta().setWarning().onClick(() => {
          this.close();
          this.onConfirm();
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
