import { App, Notice, TFile, TFolder } from "obsidian";
import type ZkPlugin from "../main";
import { ModeSuggestModal } from "../ui/modeSuggest";
import { DeleteModeModal } from "../ui/deleteModeModal";

export async function deleteModeCommand(app: App, plugin: ZkPlugin): Promise<void> {
  const { modes } = plugin.settings;

  if (modes.length === 0) {
    new Notice("削除できるモードがありません");
    return;
  }

  new ModeSuggestModal(app, modes, async (selected) => {
    new DeleteModeModal(app, selected, async (deleteFiles) => {
      // 設定から削除
      plugin.settings.modes = modes.filter((m) => m.id !== selected.id);
      await plugin.saveSettings();
      plugin.modePathStore.updateModes(plugin.settings.modes);

      if (deleteFiles) {
        // テンプレートファイルをゴミ箱へ
        const templateFile = app.vault.getFileByPath(selected.templatePath);
        if (templateFile instanceof TFile) {
          await app.vault.trash(templateFile, true);
        }
        // フォルダをゴミ箱へ
        const folder = app.vault.getFolderByPath(selected.folder);
        if (folder instanceof TFolder) {
          await app.vault.trash(folder, true);
        }
        new Notice(`モード "${selected.name}" とファイルを削除しました`);
      } else {
        new Notice(`モード "${selected.name}" を削除しました`);
      }
    }).open();
  }).open();
}
