export interface FileSystem {
  createFolder(path: string): Promise<void>;
  createFile(path: string, content: string): Promise<void>;
  exists(path: string): boolean;
}
