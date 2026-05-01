import { App, Notice } from "obsidian";
import type ZkPlugin from "../main";
import { ModeDefinition } from "../core/zkSettings";
import { CreateModeModal } from "../ui/createModeModal";
import { genUniqueID, genUniqueAlias } from "../core/idGenerator";
import { loadOrCreateTemplate, applyPlaceholders, DEFAULT_NOTE_TEMPLATE, DEFAULT_ROOT_TEMPLATE } from "../core/templateLoader";

export async function createModeCommand(app: App, plugin: ZkPlugin): Promise<void> {
  const existingIds = plugin.settings.modes.map((m) => m.id);

  new CreateModeModal(
    app,
    existingIds,
    plugin.settings.defaultModeFolder,
    plugin.settings.defaultTemplateFolder,
    async (def: ModeDefinition) => {
      // フォルダを作成（既存の場合はスキップ）
      if (!app.vault.getFolderByPath(def.folder)) {
        try {
          await app.vault.createFolder(def.folder);
        } catch {
          // 競合などで既に存在している場合は無視
        }
      }

      // ノートテンプレートを作成（存在しなければデフォルトで）
      await loadOrCreateTemplate(app, def.templatePath, DEFAULT_NOTE_TEMPLATE);

      // ルートノートを作成（存在しなければ）
      // ネストフォルダ対応: "Notes/Core" → ルートは "Notes/Core/Core.md"
      const folderName = def.folder.split("/").pop() ?? def.folder;
      const rootPath = `${def.folder}/${folderName}.md`;
      if (!app.vault.getFileByPath(rootPath)) {
        const id = genUniqueID(def.idPrefix, plugin.settings.idLen, []);
        const alias = genUniqueAlias(id, plugin.settings.aliasMinLen, []) ?? id.slice(0, plugin.settings.aliasMinLen);
        const created = new Date().toISOString().split("T")[0];
        const content = applyPlaceholders(DEFAULT_ROOT_TEMPLATE, { id, alias, created });
        await app.vault.create(rootPath, content);
      }

      // 設定に追加・保存
      plugin.settings.modes.push(def);
      await plugin.saveSettings();
      plugin.modePathStore.updateModes(plugin.settings.modes);

      new Notice(`モード "${def.name}" を作成しました`);
    }
  ).open();
}
