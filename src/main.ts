import { Plugin } from "obsidian";
import { ZkSettings, DEFAULT_SETTINGS, ZkSettingTab } from "./settings";
import { ModePathStore } from "./core/modePathStore";
import { selectModeCommand } from "./commands/selectMode";
import { mainActionCommand } from "./commands/mainAction";
import { createModeCommand } from "./commands/createMode";
import { deleteModeCommand } from "./commands/deleteMode";
import { updateModeStatusBar } from "./ui/statusBar";
import { updateBacklinksOf, isInAnyMode } from "./core/backlinkUpdater";
import { detectModeFromPath } from "./core/modeDetector";
import { goUpCommand } from "./commands/goUpCommand";

export default class ZkPlugin extends Plugin {
  settings!: ZkSettings;
  modePathStore!: ModePathStore;

  async onload() {
    await this.loadSettings();

    this.modePathStore = new ModePathStore(this.settings.modes);

    const statusBarItem = this.addStatusBarItem();
    this.modePathStore.onActiveModeChange((mode) => {
      updateModeStatusBar(statusBarItem, mode);
    });

    this.addSettingTab(new ZkSettingTab(this.app, this));

    this.addCommand({
      id: "create-mode",
      name: "モードを作成する",
      callback: () => {
        createModeCommand(this.app, this);
      },
    });

    this.addCommand({
      id: "delete-mode",
      name: "モードを削除する",
      callback: () => {
        deleteModeCommand(this.app, this);
      },
    });

    this.addCommand({
      id: "select-mode",
      name: "モードを選択する",
      callback: () => {
        selectModeCommand(this.app, this.modePathStore, this.settings, () => {
          createModeCommand(this.app, this);
        });
      },
    });

    this.addCommand({
      id: "main-action",
      name: "メインアクション（移動 / ノート作成）",
      editorCallback: () => {
        mainActionCommand(this.app, this.modePathStore, this.settings);
      },
    });

    this.addCommand({
      id: "go-up",
      name: "親ノートに移動する（↑）",
      callback: () => {
        goUpCommand(this.app);
      },
    });

    // ファイルを開いたタイミングの処理
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (!file) return;

        // モードのアクティブパスを更新
        const detectedMode = detectModeFromPath(file.path, this.settings.modes);
        if (detectedMode) {
          this.modePathStore.setPath(detectedMode.id, file.path);
        }

        // バックリンク更新（ファイルが削除直後の場合はスキップ）
        if (this.settings.enableBacklinks) {
          if (
            this.app.vault.getFileByPath(file.path) &&
            isInAnyMode(file.path, this.settings.modes, this.settings.backlinkExcludePatterns)
          ) {
            try {
              await updateBacklinksOf(this.app, file, this.settings.backlinkExcludePatterns);
            } catch {
              // 削除直後のインデックス競合は無視
            }
          }
        }
      })
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
