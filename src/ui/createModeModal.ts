import { App, Modal, Setting, TextComponent } from "obsidian";

export interface CreateModeInput {
  name: string;
  dirPath: string;
  tempPath: string;
}

export class CreateModeModal extends Modal {
  private name = "";
  private dirPath = "";
  private tempPath = "";
  private tempPathManuallyChanged = false;

  constructor(
    app: App,
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

    let tempText: TextComponent;

    new Setting(contentEl)
      .setName("モード名")
      .setDesc("表示名（例: Core, Temp）")
      .addText((t) => {
        t.setPlaceholder("Core").onChange((v) => {
          this.name = v.trim();
          if (!this.dirPath) {
            this.dirPath = this.name;
          }
          if (!this.tempPathManuallyChanged) {
            const auto = `${this.defaultTemplateFolder}/${this.name}.md`;
            this.tempPath = auto;
            tempText.setValue(auto);
          }
        });
      });

    new Setting(contentEl)
      .setName("フォルダパス")
      .setDesc("ノートを保存するフォルダ")
      .addText((t) => {
        t.setPlaceholder("Notes/Core").onChange((v) => {
          this.dirPath = v.trim();
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
      });

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });

    btnRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => {
      this.close();
    });

    btnRow
      .createEl("button", { text: "作成", cls: "mod-cta" })
      .addEventListener("click", () => {
        if (!this.name) {
          errorEl.setText("モード名を入力してください");
          errorEl.style.display = "";
          return;
        }

        const dirPath = this.dirPath || this.name;
        const rawTempPath = this.tempPath || `${this.defaultTemplateFolder}/${this.name}.md`;
        const tempPath = rawTempPath.endsWith(".md") ? rawTempPath : `${rawTempPath}.md`;

        this.close();
        this.onSubmit({ name: this.name, dirPath, tempPath });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
