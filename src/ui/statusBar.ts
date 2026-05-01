import { ModeDefinition } from "../core/zkSettings";

export function updateModeStatusBar(el: HTMLElement, mode: ModeDefinition | null): void {
  if (!mode) {
    el.setText("");
    el.removeAttribute("style");
    return;
  }
  el.setText(`● ${mode.name}`);
  el.setAttribute("style", `color: ${mode.color}; font-weight: bold;`);
}
