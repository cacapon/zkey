export interface ModeDefinition {
  id: string;          // スラッグ（例: "core", "diary"）
  name: string;        // 表示名（例: "Core"）
  folder: string;      // フォルダ名（例: "Core"）
  idPrefix: string;    // IDプレフィックス（例: "C"）
  color: string;       // ステータスバーの色（例: "#4ade80"）
  templatePath: string;// ノートテンプレートのパス
}

export interface ZkSettings {
  modes: ModeDefinition[];
  defaultModeFolder: string;     // モードフォルダのデフォルト親（例: "" or "Notes"）
  defaultTemplateFolder: string; // テンプレートのデフォルトフォルダ（例: "Meta/Template"）
  idLen: number;
  aliasMinLen: number;
  enableBacklinks: boolean;
  backlinkExcludePatterns: string[];
}

export const DEFAULT_SETTINGS: ZkSettings = {
  modes: [],
  defaultModeFolder: "",
  defaultTemplateFolder: "Meta/Template",
  idLen: 15,
  aliasMinLen: 4,
  enableBacklinks: true,
  backlinkExcludePatterns: ["Meta/Template/**"],
};
