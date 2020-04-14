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

			if (text.includes("#region") == false)
				continue;

			let name = text.replace("#region", "#").trim();
			treeRoot.push(new Dependency(name, i, vscode.TreeItemCollapsibleState.None));
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