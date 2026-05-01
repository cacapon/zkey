import { Mode } from "./mode";
import { ModeList } from "./modeList";
import { CurrentMode } from "./currentMode";

export function deleteMode(
  mode: Mode,
  modeList: ModeList,
  currentMode: CurrentMode
): boolean {
  const result = modeList.deleteMode(mode);
  if (result && currentMode.getMode()?.name === mode.name) {
    currentMode.clearMode();
  }
  return result;
}
