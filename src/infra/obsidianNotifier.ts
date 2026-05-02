import { Notice } from "obsidian";
import { Notifier } from "../core/notifier";

export class ObsidianNotifier implements Notifier {
  notify(message: string): void {
    new Notice(message);
  }
}
