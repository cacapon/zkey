import { Plugin, setIcon } from "obsidian";
import { Mode } from "./core/mode";
import { ModeList } from "./core/modeList";
import { CurrentMode } from "./core/currentMode";
import { ObsidianFileSystem } from "./infra/obsidianFileSystem";
import { ObsidianEditor } from "./infra/obsidianEditor";
import { ObsidianNotifier } from "./infra/obsidianNotifier";
import { ObsidianMetadataCache } from "./infra/obsidianMetadataCache";
import { createMode } from "./core/createMode";
import { CreateModeModal } from "./ui/createModeModal";
import { Switcher } from "./ui/switcher";
import { ZettelNameModal } from "./ui/zettelNameModal";
import { openOrCreateZettel } from "./core/openOrCreateZettel";
import { DeleteModeModal } from "./ui/deleteModeModal";
import { deleteMode } from "./core/deleteMode";
import { renameMode } from "./core/renameMode";
import { ZkSettingTab } from "./ui/settingTab";
import { ZkSettings, DEFAULT_SETTINGS } from "./core/zkSettings";

export default class ZkPlugin extends Plugin {
  private modeList = new ModeList();
  private currentMode = new CurrentMode();
  private fs = new ObsidianFileSystem(this.app.vault);
  private editor = new ObsidianEditor(this.app.workspace);
  private notifier = new ObsidianNotifier();
  private metadataCache = new ObsidianMetadataCache(this.app.metadataCache);
  private statusBarEl = this.addStatusBarItem();
  settings!: ZkSettings;

  async onload(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
    for (const mode of data?.modes ?? []) {
      this.modeList.addMode(mode);
    }
    this.addSettingTab(new ZkSettingTab(this.app, this));

    this.addCommand({
      id: "zk-create-mode",
      name: "モードを作成",
      callback: () => { this.openCreateModeModal(); },
    });

    this.addCommand({
      id: "zk-open-or-create-zettel",
      name: "Zettelを開く・作る",
      callback: async () => {
        const currentMode = this.currentMode.getMode(this.modeList);
        if (!currentMode) {
          new Switcher(this.app, [
            ...this.modeList.getModes().map((mode) => ({
              label: mode.name,
              sub: mode.dirPath,
              onChoose: async () => {
                this.currentMode.setMode(mode);
                await this.editor.openNote(mode.currPath);
                this.notifier.notify(`「${mode.name}」に切り替えました`);
                this.updateStatusBar();
              },
            })),
            {
              label: "+ 新しいモードを作成",
              onChoose: () => { this.openCreateModeModal(); },
            },
          ]).open();
          return;
        }

        const selection = this.editor.getSelection();
        if (selection) {
          this.editor.replaceSelection(`[[${selection}]]`);
          const created = await openOrCreateZettel(selection, currentMode, this.modeList, this.fs, this.editor, this.metadataCache);
          if (created) this.notifier.notify(`「${selection}」を作成しました`);
          return;
        }

        new ZettelNameModal(this.app, "", async (name) => {
          const created = await openOrCreateZettel(name, currentMode, this.modeList, this.fs, this.editor, this.metadataCache);
          if (created) this.notifier.notify(`「${name}」を作成しました`);
        }).open();
      },
    });

    this.addCommand({
      id: "zk-delete-mode",
      name: "モードを削除",
      callback: () => {
        new DeleteModeModal(this.app, this.modeList.getModes(), async (mode) => {
          deleteMode(mode, this.modeList, this.currentMode);
          await this.saveAll();
          this.notifier.notify(`「${mode.name}」を削除しました`);
          this.updateStatusBar();
        }).open();
      },
    });

    this.addCommand({
      id: "zk-switch-mode",
      name: "モードを切り替え",
      callback: () => {
        new Switcher(this.app, [
          ...this.modeList.getModes().map((mode) => ({
            label: mode.name,
            sub: mode.dirPath,
            onChoose: async () => {
              this.currentMode.setMode(mode);
              await this.editor.openNote(mode.currPath);
              this.notifier.notify(`「${mode.name}」に切り替えました`);
              this.updateStatusBar();
            },
          })),
          {
            label: "+ 新しいモードを作成",
            onChoose: () => { this.openCreateModeModal(); },
          },
        ]).open();
      },
    });
  }

  private openCreateModeModal(): void {
    new CreateModeModal(this.app, this.settings.defaultNoteFolder, this.settings.defaultTemplateFolder, async (input) => {
      const ok = await createMode(
        input.name,
        input.dirPath,
        input.tempPath,
        this.modeList,
        this.fs,
        this.metadataCache,
        input.prefix,
        input.icon
      );
      if (!ok) {
        this.notifier.notify(`「${input.name}」は既に存在します`);
        return;
      }

      const mode = this.modeList.getModes().find((m) => m.name === input.name);
      if (mode) {
        await this.saveAll();
        this.currentMode.setMode(mode);
        await this.editor.openNote(mode.currPath);
        this.notifier.notify(`「${input.name}」を作成しました`);
        this.updateStatusBar();
      }
    }).open();
  }

  private async saveAll(): Promise<void> {
    await this.saveData({ settings: this.settings, modes: this.modeList.getModes() });
  }

  async updateSettings(patch: Partial<ZkSettings>): Promise<void> {
    Object.assign(this.settings, patch);
    await this.saveAll();
  }

  getModes() {
    return this.modeList.getModes();
  }

  async renameModeConfig(oldName: string, newName: string): Promise<boolean> {
    const mode = this.modeList.getModes().find((m) => m.name === oldName);
    if (!mode) return false;
    const ok = await renameMode(mode, newName, this.modeList, this.fs);
    if (ok) {
      await this.saveAll();
      this.updateStatusBar();
      this.notifier.notify(`「${oldName}」を「${newName}」にリネームしました`);
    } else {
      this.notifier.notify(`「${newName}」は既に存在します`);
    }
    return ok;
  }

  async updateModeConfig(name: string, patch: Pick<Mode, "icon" | "prefix">): Promise<void> {
    const mode = this.modeList.getModes().find((m) => m.name === name);
    if (!mode) return;
    this.modeList.updateMode({ ...mode, ...patch });
    await this.saveAll();
    this.updateStatusBar();
  }

  updateStatusBar(): void {
    const mode = this.currentMode.getMode(this.modeList);
    this.statusBarEl.empty();
    if (mode) {
      if (mode.icon) {
        const iconEl = this.statusBarEl.createSpan();
        setIcon(iconEl, mode.icon);
      }
      this.statusBarEl.createSpan({ text: (mode.icon ? " " : "") + mode.name });
    }
  }
}
