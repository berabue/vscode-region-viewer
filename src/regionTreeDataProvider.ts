import * as vscode from 'vscode';
import * as markers from './markers.json';

export class RegionTreeDataProvider implements vscode.TreeDataProvider<Dependency> {
	private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<Dependency | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;
	private data?: Dependency[];

	constructor() {
		this.findRegions();
	}

	refresh(): void {
		this.findRegions();
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

	private findRegions(): void {
		const document = vscode.window.activeTextEditor?.document;
		if (document == undefined)
			return

		let treeRoot: Dependency[] = [];
		let regionStack: Dependency[] = [];

		let markersOverrides: {[language: string]: { "start": string, "end": string}}|undefined;
		let configuration = vscode.workspace.getConfiguration();

		try {
			markersOverrides = configuration.get<{[language: string]: { "start": string, "end": string}}>('region-viewer.markers-overrides');
		} catch (error) {
			markersOverrides = undefined;
			vscode.window.showWarningMessage('Failed to parse markers overrides for Region Viewer. Check documentation for correct format');
		}


		if (document.languageId in (markersOverrides ?? {}) || document.languageId in markers)
		{
			const GTMarkersOverride: {[language: string]: { "start": string, "end": string}}|undefined = markersOverrides;

			// Create Generally Typed Markers, so that we can
			// index them using languageID strings
			const GTMarkers: {[language: string]: { "start": string, "end": string}} = markers;

			const startRegExp = new RegExp((GTMarkersOverride === undefined ? GTMarkers[document.languageId] : GTMarkersOverride[document.languageId]).start);
			const endRegExp = new RegExp((GTMarkersOverride === undefined ? GTMarkers[document.languageId] : GTMarkersOverride[document.languageId]).end);

			const isRegionStart = (t: string) => startRegExp.test(t);
			const isRegionEnd = (t: string) => endRegExp.test(t);
			
			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				if (line == undefined)
					continue;
	
				let range = new vscode.Range(line.range.start, line.range.end);
				let text = document.getText(range);
				if (text == undefined)
					continue;
	
				if (isRegionStart(text)) {
					const regexResult = startRegExp.exec(text);
					const name = this.getName(text, regexResult);
					const dep = new Dependency(name, i);

					// If we have a parent, register as their child
					if (regionStack.length > 0) {
						let parentDep = regionStack[regionStack.length - 1];
						parentDep.children?.push(dep);
						parentDep.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
					}

					regionStack.push(dep);
				}
				else if (isRegionEnd(text)) {
					// If we just ended a root region, add it to treeRoot
					if (regionStack.length === 1) {
						treeRoot.push(regionStack[0]);
					}
					
					regionStack.pop();
				}
			}
	
			// If the region stack isn't empty, we didn't properly close all regions
			if (regionStack.length > 0) {
				treeRoot.push(regionStack[0]);
			}
	
			this.data = treeRoot;
		}
	}

	private getName(input: string, match: RegExpExecArray|null): string {
		if (match && match.groups) {
			const groupIDs = [
				"name",
				"nameAlt"
			];
			
			// Look into capture groups
			for (const groupID of groupIDs) {
				if (groupID in match.groups && match.groups[groupID] !== undefined) {
					const name = match.groups[groupID].trim();
					if (name.length > 0) return "# " + name;
				}
			}
	
			// Empty region name
			return "# region";
		}
		else {
			// Regex error or no groups found
			return input;
		}
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