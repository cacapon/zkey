import {Mode} from './mode';

type ModePaths = Record<Mode, string>;

export class ModePathStore {
	private paths: ModePaths;
	
	constructor(defaults: ModePaths) {
		this.paths = { ...defaults };
	}
	getPath(mode: Mode): string {
		return this.paths[mode];
	}

	setPath(mode: Mode, path: string): void {
		this.paths[mode] = path;
	}
}
