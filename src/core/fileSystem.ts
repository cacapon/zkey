export interface FileSystem {
  createFolder(path: string): Promise<void>;
  createFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  listFiles(dirPath: string): string[];
}
