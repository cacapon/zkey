import { App, Modal, Setting } from "obsidian";
import { ModeDefinition } from "../core/zkSettings";
import { FolderSuggest } from "./folderSuggest";

const DEFAULT_COLORS = [
  { label: "グリーン", value: "#4ade80" },
  { label: "ブルー",   value: "#38bdf8" },
  { label: "イエロー", value: "#facc15" },
  { label: "ピンク",   value: "#f472b6" },
  { label: "オレンジ", value: "#fb923c" },
  { label: "パープル", value: "#a78bfa" },
];

export class CreateModeModal extends Modal {
  private onSubmit: (def: ModeDefinition) => void;
  private existingIds: string[];
  private defaultModeFolder: string;
  private defaultTemplateFolder: string;

  private name = "";
  private folder = "";
  private idPrefix = "";
  private color = DEFAULT_COLORS[0].value;

  constructor(
    app: App,
    existingIds: string[],
    defaultModeFolder: string,
    defaultTemplateFolder: string,
    onSubmit: (def: ModeDefinition) => void
  ) {
    super(app);
    this.existingIds = existingIds;
    this.defaultModeFolder = defaultModeFolder;
    this.defaultTemplateFolder = defaultTemplateFolder;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "新しいモードを作成" });

    let folderInput: HTMLInputElement;
    let prefixInput: HTMLInputElement;
    let errorEl: HTMLElement;

    new Setting(contentEl)
      .setName("モード名")
      .setDesc("表示名（例: Core, Diary）")
      .addText((t) => {
        t.setPlaceholder("Core").onChange((v) => {
          this.name = v.trim();
          // フォルダが未入力なら自動設定
          if (!folderInput.value) {
            folderInput.value = this.defaultModeFolder
              ? `${this.defaultModeFolder}/${this.name}`
              : this.name;
            this.folder = folderInput.value;
          }
          // IDプレフィックスが未入力なら自動設定
          if (!prefixInput.value) {
            prefixInput.value = this.name[0]?.toUpperCase() ?? "";
            this.idPrefix = prefixInput.value;
          }
        });
      });

    new Setting(contentEl)
      .setName("フォルダ")
      .setDesc("ノートを保存するフォルダのパス")
      .addText((t) => {
        folderInput = t.inputEl;
        t.setPlaceholder(this.defaultModeFolder ? `${this.defaultModeFolder}/Core` : "Core")
          .onChange((v) => {
            this.folder = v.trim();
          });
        new FolderSuggest(this.app, folderInput);
      });

    new Setting(contentEl)
      .setName("IDプレフィックス")
      .setDesc("ID先頭の文字（例: C → C2j4k9m...）")
      .addText((t) => {
        prefixInput = t.inputEl;
        t.setPlaceholder("C").onChange((v) => {
          this.idPrefix = v.trim();
        });
      });

    new Setting(contentEl)
      .setName("カラー")
      .setDesc("ステータスバーに表示する色")
      .addDropdown((d) => {
        for (const c of DEFAULT_COLORS) {
          d.addOption(c.value, c.label);
        }
        d.setValue(this.color).onChange((v) => {
          this.color = v;
        });
      });

    errorEl = contentEl.createEl("p", { cls: "zk-error-text" });
    errorEl.style.color = "var(--text-error)";
    errorEl.style.display = "none";

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });

    btnRow.createEl("button", { text: "キャンセル" }).addEventListener("click", () => {
      this.close();
    });

    const createBtn = btnRow.createEl("button", { text: "作成", cls: "mod-cta" });
    createBtn.addEventListener("click", () => {
      if (!this.name) {
        errorEl.setText("モード名を入力してください");
        errorEl.style.display = "";
        return;
      }

      const id = this.name.toLowerCase().replace(/[\s　]+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (this.existingIds.includes(id)) {
        errorEl.setText(`ID "${id}" はすでに使用されています`);
        errorEl.style.display = "";
        return;
      }

      const folder = this.folder || (
        this.defaultModeFolder ? `${this.defaultModeFolder}/${this.name}` : this.name
      );
      const idPrefix = this.idPrefix || (this.name[0]?.toUpperCase() ?? "M");
      const slug = this.name.toLowerCase().replace(/\s+/g, "-");
      const templatePath = this.defaultTemplateFolder
        ? `${this.defaultTemplateFolder}/zk-${slug}-note.md`
        : `zk-${slug}-note.md`;

      this.close();
      this.onSubmit({ id, name: this.name, folder, idPrefix, color: this.color, templatePath });
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
