import { App } from "obsidian";

export const DEFAULT_NOTE_TEMPLATE = `---
created: "{{created}}"
id: "{{id}}"
aliases:
  - "{{alias}}"
tags:
---
↑: [[{{parent}}]]

-

%%
## Backlinks (auto)
<!-- ZK_BACKLINKS_START -->
<!-- ZK_BACKLINKS_END -->
%%`;

export const DEFAULT_ROOT_TEMPLATE = `---
created: "{{created}}"
id: "{{id}}"
aliases:
  - "{{alias}}"
---

%%
## Backlinks (auto)
<!-- ZK_BACKLINKS_START -->
<!-- ZK_BACKLINKS_END -->
%%`;

// テンプレートファイルを読み込む。存在しなければデフォルト内容で自動作成する。
export async function loadOrCreateTemplate(
  app: App,
  templatePath: string,
  defaultContent: string
): Promise<string> {
  const existing = app.vault.getFileByPath(templatePath);
  if (existing) {
    return await app.vault.read(existing);
  }

  const dir = templatePath.substring(0, templatePath.lastIndexOf("/"));
  if (dir && !app.vault.getFolderByPath(dir)) {
    try {
      await app.vault.createFolder(dir);
    } catch {
      // 競合などで既に存在している場合は無視
    }
  }
  const created = await app.vault.create(templatePath, defaultContent);
  return await app.vault.read(created);
}

// {{key}} 形式のプレースホルダーを置換する
export function applyPlaceholders(
  template: string,
  params: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
