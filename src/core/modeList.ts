import { Mode } from "./mode";

export class ModeList {
  private modes: Mode[] = [];

  addMode(mode: Mode): boolean {
    if (this.modes.some((m) => m.name === mode.name)) {
      return false;
    }
    this.modes.push(mode);
    return true;
  }

  deleteMode(mode: Mode): boolean {
    const index = this.modes.findIndex((m) => m.name === mode.name);
    if (index === -1) {
      return false;
    }
    this.modes.splice(index, 1);
    return true;
  }

  getModes(): Mode[] {
    return [...this.modes];
  }

  updateMode(mode: Mode): void {
    const index = this.modes.findIndex((m) => m.name === mode.name);
    if (index !== -1) {
      this.modes[index] = mode;
    }
  }
}
