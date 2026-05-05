import { App } from "obsidian";

export function getCoreTemplateFolder(app: App): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = (app as any).internalPlugins?.plugins?.["templates"];
  if (!plugin?.enabled) return null;
  return (plugin.instance?.options?.folder as string) ?? "";
}
