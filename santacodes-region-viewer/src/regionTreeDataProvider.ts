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

	getChildren(element?: Dependency): Thenable<Dependency[]> {
		return Promise.resolve(this.data!);
	}

	private findRegion(): void {
		const document = vscode.window.activeTextEditor?.document;
		if (document == undefined)
			return

		let treeRoot = [];
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
            const regionMarkers = [
                "//#region",
                "//region",
                "#region",
                "#pragma region",
                "#Region"
            ]

            for (const marker of regionMarkers) {
                // Check if line starts with on of the region markers
                if(text.trim().startsWith(marker)) {
                    let name = text.replace(marker, "").trim(); // remove first marker
                    if (name.length === 0) name = "region"; // ensure name is not empty
                    name = "# " + name; // prepend with the # symbol

                    treeRoot.push(new Dependency(name, i, vscode.TreeItemCollapsibleState.None));
                }
            }
		}
		this.data = treeRoot;
	}
}

class Dependency extends vscode.TreeItem {
	constructor(label: string, line: number, collapsibleState: vscode.TreeItemCollapsibleState) {
		super(label, collapsibleState);
		this.command = {
			title: '',
			command: 'region-viewer.reveal',
			arguments: [
				line
			]
		}
	}
}