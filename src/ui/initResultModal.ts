import { App, Modal } from "obsidian";

export interface InitResultItem {
  label: string;
  status: "created" | "skipped" | "reset";
}

export class InitResultModal extends Modal {
  private results: InitResultItem[];

  constructor(app: App, results: InitResultItem[]) {
    super(app);
    this.results = results;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "初期化結果" });

    const list = contentEl.createEl("ul");
    for (const item of this.results) {
      const li = list.createEl("li");
      const statusText =
        item.status === "created" ? "✓ 作成" :
        item.status === "reset"   ? "↺ リセット" :
                                    "− スキップ（既存）";
      li.createEl("span", { text: `${statusText}　` });
      li.createEl("span", { text: item.label });
    }

    contentEl.createEl("button", { text: "閉じる" }).addEventListener("click", () => {
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
