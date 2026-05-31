export interface ZKeySettings {
  defaultTemplateFolder: string;
  defaultNoteFolder: string;
  autoSwitchMode: boolean;
  insertOriginInBody: boolean;
}

export const DEFAULT_SETTINGS: ZKeySettings = {
  defaultTemplateFolder: "Templates",
  defaultNoteFolder: "Zk",
  autoSwitchMode: true,
  insertOriginInBody: false,
};
