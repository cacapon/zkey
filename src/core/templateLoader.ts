import { App } from "obsidian";

export const DEFAULT_CORE_NOTE_TEMPLATE = `---
created: {{created}}
id: "{{id}}"
aliases:
  - "{{alias}}"
tags:
---
↑: [[{{parent}}]]

-
[[TODO]]

%%
## Backlinks (auto)
<!-- ZK_BACKLINKS_START -->
<!-- ZK_BACKLINKS_END -->
%%`;

export const DEFAULT_REF_NOTE_TEMPLATE = `---
created: {{created}}
id: "{{id}}"
aliases:
  - "{{alias}}"
tags:
src: "[[{{src}}]]"
page:
---
↑: [[{{src}}]]

-

%%
## Backlinks (auto)
<!-- ZK_BACKLINKS_START -->
<!-- ZK_BACKLINKS_END -->
%%`;

export const DEFAULT_CORE_ROOT_TEMPLATE = `# Core

自分の知識を永続的に保存するノート。
外部情報（Ref）や一時メモ（Temp）から昇華した、自分の言葉による理解を記録する。

## Coreノートとは
- 自分の言葉で書かれた、再利用可能な知識の単位
- IDとエイリアスを持ち、他のノートからリンクされる
- 削除・移動せず、更新していく

%%
## Backlinks (auto)
<!-- ZK_BACKLINKS_START -->
<!-- ZK_BACKLINKS_END -->
%%`;

export const DEFAULT_REF_ROOT_TEMPLATE = `# Ref

外部情報（書籍・論文・記事など）への参照を記録するノート。
SrcノートをもとにRefノートを作成し、参照箇所・引用・要約を書く。

## Refノートとは
- Srcノート（参考文献）に紐づく参照箇所のノート
- IDとエイリアスを持ち、Srcを起点に派生する
- ページ・章・引用など、外部知識の「どこ」を記録する

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
    await app.vault.createFolder(dir);
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
