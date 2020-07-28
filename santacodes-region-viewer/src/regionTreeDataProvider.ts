import * as vscode from 'vscode';


export class RegionTreeDataProvider implements vscode.TreeDataProvider<Dependency> {
	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<Dependency | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;
	private data?: Dependency[];

	constructor() {
		this.findRegion();
	}

	refresh(): void {
		this.findRegion();
		this._onDidChangeTreeData.fire();
	}
  
	getTreeItem(element: Dependency): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Dependency): vscode.ProviderResult<Dependency[]> {
		
		if (element === undefined) {
			return this.data;
		}

		return element.children;
	}

	private findRegion(): void {
		const document = vscode.window.activeTextEditor?.document;
		if (document == undefined)
			return

		let treeRoot = [];
		let regionStack = [];

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			if (line == undefined)
				continue;

			let range = new vscode.Range(line.range.start, line.range.end);
			let text = document.getText(range);
			if (text == undefined)
				continue;

			// Region markers as they're documented in:
			// https://code.visualstudio.com/updates/v1_17#_folding-regions
			const startMarkers = [
				"//#region",
				"//region",
				"#region",
				"#pragma region",
				"#Region"
			]

			const endMarkers = [
				"//#endregion",
				"//endregion",
				"#endregion",
				"#pragma endregion",
				"#End Region"
			]

			// Region start
			for (const marker of startMarkers) {
				if(text.trim().startsWith(marker)) {
					const name = this.getRegionName(text, marker);
					const dep = new Dependency(name, i);

					if (regionStack.length > 0) {
						let parentDep = regionStack[regionStack.length - 1];
						parentDep.children?.push(dep);
						parentDep.collapsibleState =  vscode.TreeItemCollapsibleState.Collapsed;	// Possibly optimise
					}

					regionStack.push(dep);
				}
			}

			// Region end
			for (const marker of endMarkers) {
				if(text.trim().startsWith(marker)) {
					if (regionStack.length === 1) {
						treeRoot.push(regionStack[0]);
					}

					regionStack.pop();
				}
			}
		}

		// Resolve remaining stack entries
		// These regions were opened but never closed
		if (regionStack.length > 0) {
			treeRoot.push(regionStack[0]);
		}

		this.data = treeRoot;
	}

	private getRegionName(line: string, marker: string): string {
		// remove first marker
		let name = line.replace(marker, "").trim();
		// ensure name is not empty
		if (name.length === 0) name = "region";
		// prepend with the # symbol
		return "# " + name;
	}
}

class Dependency extends vscode.TreeItem {

	children: Dependency[] = [];

	constructor(label: string, line: number) {
		super(label, vscode.TreeItemCollapsibleState.None);

		this.command = {
			title: '',
			command: 'region-viewer.reveal',
			arguments: [
				line
			]
		}
	}
}