import { Mode } from "./mode";

export class CurrentMode {
  private mode: Mode | null = null;

  setMode(mode: Mode): void {
    this.mode = mode;
  }

  getMode(): Mode | null {
    return this.mode;
  }

  clearMode(): void {
    this.mode = null;
  }
}
