import { moment } from "obsidian";

const ja = {
  // notifications
  switchedToMode: (name: string) => `「${name}」に切り替えました`,
  noMode: "モードなし",
  noModeSelected: "モードが選択されていません",
  noLinksFound: "リンクが見つかりません",
  modeAlreadyExists: (name: string) => `「${name}」は既に存在します`,
  modeCreated: (name: string) => `「${name}」を作成しました`,
  modeUpdated: (name: string) => `「${name}」を更新しました`,
  modeDeleted: (name: string) => `「${name}」を削除しました`,
  noteCreated: (name: string) => `「${name}」を作成しました`,

  // commands
  cmdCreateMode: "モードを作成",
  cmdOpenOrCreateZettel: "Zettelを開く・作る",
  cmdDeleteMode: "モードを削除",
  cmdGoToRoot: "rootノートに戻る",
  cmdLinkSwitcher: "リンクスイッチャー",
  cmdSwitchMode: "モード切り替え",

  // switcher
  createNewMode: "+ 新しいモードを作成",
  createNote: (name: string) => `「${name}」を新規作成`,
  enterNoteName: (modeName: string) => `「${modeName}」のノート名を入力…`,

  // setting tab
  settingAutoSwitchName: "モードの自動切り替え",
  settingAutoSwitchDesc: "ファイルを開いたとき、そのファイルのモードに自動で切り替えます",
  settingInsertOriginName: "本文へのzk-origin挿入",
  settingInsertOriginDesc: "モード作成時のテンプレートにzk-originのリンクを本文へ挿入します（↑: [[{{zk-origin}}]]）",
  settingDefaultFolderName: "デフォルトノートフォルダ",
  settingDefaultFolderDesc: "モード作成時のフォルダパスの初期値に使われます",
  settingTemplateFolderName: "テンプレートフォルダ",
  settingTemplateFolderEnabled: (folder: string) => `Obsidian Templates プラグインのフォルダを使用しています: ${folder || "（未設定）"}`,
  settingTemplateFolderDisabled: "Obsidian Templates プラグインが無効です。コアプラグインから有効にしてください。",
  settingOpenSettings: "設定を開く",
  settingModesHeading: "モード設定",
  settingEditMode: "編集",

  // upsert mode modal
  editModeTitle: (name: string) => `「${name}」を編集`,
  createModeTitle: "新しいモードを作成",
  modeNameRequired: "モード名を入力してください",
  fieldModeName: "モード名",
  fieldModeNameDesc: "表示名（例: Core, Temp）。大文字・小文字は同じものとして扱われます。",
  fieldSelectIcon: "アイコンを選択",
  fieldIdPrefix: "IDプレフィックス",
  fieldIdPrefixDesc: "ノートIDの先頭に付ける文字（例: C → Ca3f9x2...）。空欄でも可。",
  fieldRootPath: "ルートノートパス",
  fieldRootPathDesc: "モードの起点となるノート。フォルダパスはここから自動設定されます。",
  fieldTemplatePath: "テンプレートパス",
  fieldTemplatePathDesc: "新規ノート作成時に使うテンプレートファイル",
  btnCancel: "キャンセル",
  btnSave: "保存",
  btnCreate: "作成",

  // confirm modal
  confirmDelete: (name: string) => `「${name}」を削除しますか？`,
  btnDelete: "削除",

  // icon picker
  noIcon: "(なし)",
};

const en: typeof ja = {
  // notifications
  switchedToMode: (name: string) => `Switched to "${name}"`,
  noMode: "No mode",
  noModeSelected: "No mode selected",
  noLinksFound: "No links found",
  modeAlreadyExists: (name: string) => `"${name}" already exists`,
  modeCreated: (name: string) => `Created "${name}"`,
  modeUpdated: (name: string) => `Updated "${name}"`,
  modeDeleted: (name: string) => `Deleted "${name}"`,
  noteCreated: (name: string) => `Created "${name}"`,

  // commands
  cmdCreateMode: "Create mode",
  cmdOpenOrCreateZettel: "Open or create Zettel",
  cmdDeleteMode: "Delete mode",
  cmdGoToRoot: "Go to root note",
  cmdLinkSwitcher: "Link switcher",
  cmdSwitchMode: "Switch mode",

  // switcher
  createNewMode: "+ Create new mode",
  createNote: (name: string) => `Create "${name}"`,
  enterNoteName: (modeName: string) => `Enter note name in "${modeName}"…`,

  // setting tab
  settingAutoSwitchName: "Auto switch mode",
  settingAutoSwitchDesc: "Automatically switches to the mode of the file you open",
  settingInsertOriginName: "Insert zk-origin in body",
  settingInsertOriginDesc: "Adds ↑: [[{{zk-origin}}]] to the template when creating a mode",
  settingDefaultFolderName: "Default note folder",
  settingDefaultFolderDesc: "Initial folder path when creating a mode",
  settingTemplateFolderName: "Template folder",
  settingTemplateFolderEnabled: (folder: string) => `Using Obsidian Templates plugin folder: ${folder || "(not set)"}`,
  settingTemplateFolderDisabled: "Obsidian Templates plugin is disabled. Enable it from Core plugins.",
  settingOpenSettings: "Open settings",
  settingModesHeading: "Modes",
  settingEditMode: "Edit",

  // upsert mode modal
  editModeTitle: (name: string) => `Edit "${name}"`,
  createModeTitle: "Create new mode",
  modeNameRequired: "Please enter a mode name",
  fieldModeName: "Mode name",
  fieldModeNameDesc: "Display name (e.g. Core, Temp). Case-insensitive.",
  fieldSelectIcon: "Select icon",
  fieldIdPrefix: "ID prefix",
  fieldIdPrefixDesc: "Prefix for note IDs (e.g. C → Ca3f9x2...). Optional.",
  fieldRootPath: "Root note path",
  fieldRootPathDesc: "The entry point note. Folder path is derived from this.",
  fieldTemplatePath: "Template path",
  fieldTemplatePathDesc: "Template file used when creating new notes",
  btnCancel: "Cancel",
  btnSave: "Save",
  btnCreate: "Create",

  // confirm modal
  confirmDelete: (name: string) => `Delete "${name}"?`,
  btnDelete: "Delete",

  // icon picker
  noIcon: "(none)",
};

export const i18n = moment.locale() === "ja" ? ja : en;
