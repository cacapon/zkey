import { Plugin, moment, setIcon } from "obsidian";
import { Mode } from "./core/mode";
import { ModeList } from "./core/modeList";
import { CurrentMode } from "./core/currentMode";
import { ObsidianFileSystem } from "./infra/obsidianFileSystem";
import { getCoreTemplateFolder } from "./infra/obsidianTemplateFolder";
import { ObsidianEditor } from "./infra/obsidianEditor";
import { ObsidianNotifier } from "./infra/obsidianNotifier";
import { ObsidianMetadataCache } from "./infra/obsidianMetadataCache";
import { upsertMode } from "./core/upsertMode";
import { UpsertModeModal } from "./ui/upsertModeModal";
import { Switcher } from "./ui/switcher";
import { openOrCreateZettel } from "./core/openOrCreateZettel";
import { DeleteModeModal } from "./ui/deleteModeModal";
import { deleteMode } from "./core/deleteMode";
import { ZKeySettingTab } from "./ui/settingTab";
import { ZKeySettings, DEFAULT_SETTINGS } from "./core/zkSettings";
import { getLinkSwitcherItems } from "./core/linkSwitcherItems";
import { i18n } from "./i18n";

export default class ZKeyPlugin extends Plugin {
  private modeList = new ModeList();
  private currentMode = new CurrentMode();
  private fs = new ObsidianFileSystem(this.app.vault);
  private editor = new ObsidianEditor(this.app.workspace);
  private notifier = new ObsidianNotifier();
  private metadataCache = new ObsidianMetadataCache(this.app.metadataCache);
  private statusBarEl = this.addStatusBarItem();
  settings!: ZKeySettings;

  async onload(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
    for (const raw of data?.modes ?? []) {
      const mode = { rootPath: `${raw.dirPath}/${raw.name}.md`, ...raw };
      this.modeList.addMode(mode);
    }
    this.addSettingTab(new ZKeySettingTab(this.app, this));

    this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
      if (!this.settings.autoSwitchMode) return;
      const filePath = this.editor.getActiveFilePath();
      if (!filePath) return;
      const prevMode = this.currentMode.getMode(this.modeList);
      const nextMode = this.modeList.getModes().find((m) => filePath.startsWith(m.dirPath + "/"));
      if (nextMode) {
        this.modeList.updateMode({ ...nextMode, currPath: filePath });
        this.currentMode.setMode(nextMode);
        if (prevMode?.name !== nextMode.name) {
          this.notifier.notify(i18n.switchedToMode(nextMode.name));
        }
      } else {
        if (prevMode) {
          this.currentMode.clearMode();
          this.notifier.notify(i18n.noMode);
        }
      }
      this.updateStatusBar();
      void this.saveAll();
    }));

    this.addCommand({
      id: "zkey-create-mode",
      name: i18n.cmdCreateMode,
      icon: "folder-plus",
      callback: () => { this.openUpsertModeModal(null); },
    });

    this.addCommand({
      id: "zkey-open-or-create-zettel",
      name: i18n.cmdOpenOrCreateZettel,
      icon: "file-search-corner",
      callback: async () => {
        const currentMode = this.currentMode.getMode(this.modeList);
        if (!currentMode) {
          new Switcher(this.app, [
            ...this.modeList.getModes().map((mode) => ({
              label: mode.name,
              sub: mode.dirPath,
              onChoose: async () => {
                this.currentMode.setMode(mode);
                this.notifier.notify(i18n.switchedToMode(mode.name));
                this.updateStatusBar();
                await this.openZettelFlow(mode);
              },
            })),
            {
              label: i18n.createNewMode,
              onChoose: () => { this.openUpsertModeModal(null); },
            },
          ]).open();
          return;
        }

        await this.openZettelFlow(currentMode);
      },
    });

    this.addCommand({
      id: "zkey-delete-mode",
      name: i18n.cmdDeleteMode,
      icon: "folder-x",
      callback: () => {
        new DeleteModeModal(this.app, this.modeList.getModes(), async (mode) => {
          deleteMode(mode, this.modeList, this.currentMode);
          await this.saveAll();
          this.notifier.notify(i18n.modeDeleted(mode.name));
          this.updateStatusBar();
        }).open();
      },
    });

    this.addCommand({
      id: "zkey-go-to-root",
      name: i18n.cmdGoToRoot,
      icon: "home",
      callback: async () => {
        const mode = this.currentMode.getMode(this.modeList);
        if (!mode) {
          this.notifier.notify(i18n.noModeSelected);
          return;
        }
        await this.editor.openNote(mode.rootPath);
      },
    });

    this.addCommand({
      id: "zkey-link-switcher",
      name: i18n.cmdLinkSwitcher,
      icon: "network",
      callback: async () => {
        const filePath = this.editor.getActiveFilePath();
        if (!filePath) return;
        const items = getLinkSwitcherItems(filePath, this.metadataCache);
        if (items.length === 0) {
          this.notifier.notify(i18n.noLinksFound);
          return;
        }
        const typeLabel = { forward: "link", backlink: "backlink", "2step": "2step-link" };
        new Switcher(this.app, items.map((item) => ({
          label: `${item.path.split("/").pop()?.replace(/\.md$/, "") ?? item.path}  [${typeLabel[item.type]}]`,
          onChoose: async () => { await this.editor.openNote(item.path); },
        }))).open();
      },
    });

    this.addCommand({
      id: "zkey-switch-mode",
      name: i18n.cmdSwitchMode,
      icon: "layers",
      callback: () => {
        new Switcher(this.app, [
          ...this.modeList.getModes().map((mode) => ({
            label: mode.name,
            sub: mode.dirPath,
            onChoose: async () => {
              this.currentMode.setMode(mode);
              await this.editor.openNote(mode.currPath);
              this.notifier.notify(i18n.switchedToMode(mode.name));
              this.updateStatusBar();
            },
          })),
          {
            label: i18n.createNewMode,
            onChoose: () => { this.openUpsertModeModal(null); },
          },
        ]).open();
      },
    });
  }

  private openUpsertModeModal(existingMode: Mode | null): void {
    const templateFolder = getCoreTemplateFolder(this.app) ?? this.settings.defaultTemplateFolder;
    new UpsertModeModal(this.app, existingMode, this.settings.defaultNoteFolder, templateFolder, async (input) => {
      const ok = await upsertMode(existingMode, input, this.modeList, this.fs, this.metadataCache, this.settings.insertOriginInBody, moment.locale());
      if (!ok) {
        this.notifier.notify(i18n.modeAlreadyExists(input.name));
        return;
      }
      const mode = this.modeList.getModes().find((m) => m.name === input.name);
      if (mode) {
        await this.saveAll();
        if (!existingMode) {
          this.currentMode.setMode(mode);
          await this.editor.openNote(mode.currPath);
          this.notifier.notify(i18n.modeCreated(input.name));
        } else {
          this.notifier.notify(i18n.modeUpdated(input.name));
        }
        this.updateStatusBar();
      }
    }).open();
  }

  private async openZettelFlow(mode: Mode): Promise<void> {
    const selection = this.editor.getSelection();
    if (selection) {
      this.editor.replaceSelection(`[[${selection}]]`);
      const created = await openOrCreateZettel(selection, mode, this.modeList, this.fs, this.editor, this.metadataCache);
      if (created) this.notifier.notify(i18n.noteCreated(selection));
      return;
    }

    const cursorLink = this.editor.getCursorLinkTarget();
    if (cursorLink) {
      const sourcePath = this.editor.getActiveFilePath() ?? "";
      const resolved = this.metadataCache.resolveLink(cursorLink, sourcePath);
      if (resolved) {
        await this.editor.openNote(cursorLink);
      } else {
        const created = await openOrCreateZettel(cursorLink, mode, this.modeList, this.fs, this.editor, this.metadataCache);
        if (created) this.notifier.notify(i18n.noteCreated(cursorLink));
      }
      return;
    }

    const fileItems = this.fs.listFiles(mode.dirPath).map((path) => ({
      label: path.split("/").pop()?.replace(/\.md$/, "") ?? path,
      onChoose: async () => { await this.editor.openNote(path); },
    }));
    new Switcher(this.app, fileItems, (query, filtered) => {
      const exact = filtered.some((i) => i.label.toLowerCase() === query.toLowerCase());
      if (exact) return null;
      return {
        label: i18n.createNote(query),
        onChoose: async () => {
          const created = await openOrCreateZettel(query, mode, this.modeList, this.fs, this.editor, this.metadataCache);
          if (created) this.notifier.notify(i18n.noteCreated(query));
        },
      };
    }, i18n.enterNoteName(mode.name)).open();
  }

  private async saveAll(): Promise<void> {
    await this.saveData({ settings: this.settings, modes: this.modeList.getModes() });
  }

  async updateSettings(patch: Partial<ZKeySettings>): Promise<void> {
    Object.assign(this.settings, patch);
    await this.saveAll();
  }

  getModes() {
    return this.modeList.getModes();
  }

  async upsertModeConfig(existingMode: Mode, input: { name: string; rootPath: string; tempPath: string; prefix: string; icon: string }): Promise<boolean> {
    const ok = await upsertMode(existingMode, input, this.modeList, this.fs, this.metadataCache, this.settings.insertOriginInBody, moment.locale());
    if (ok) {
      await this.saveAll();
      this.updateStatusBar();
      this.notifier.notify(i18n.modeUpdated(input.name));
    } else {
      this.notifier.notify(i18n.modeAlreadyExists(input.name));
    }
    return ok;
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
