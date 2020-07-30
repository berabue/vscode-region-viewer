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

		// console.log(new RegExp(markers.start.csharp).test("#region"));

		if (document.languageId in markers)
		{
			const indexableMarkings: {[language: string]: { "start": string, "end": string}} = markers;

			const startRegExp = new RegExp(indexableMarkings[document.languageId].start);
			const endRegExp = new RegExp(indexableMarkings[document.languageId].end);

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
	
				// const trimmedText = text.trim();
	
				if (isRegionStart(text)) {
					const name = text;	// TODO use regex groups
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
	
			// If the region stack isn't empty, we didn't properly  close all
			// regions, add the remaining root region to treeRoot anyways
			if (regionStack.length > 0) {
				treeRoot.push(regionStack[0]);
			}
	
			this.data = treeRoot;
		}
	}

	// More concise way to handle / recognize nesting?
	// https://github.com/microsoft/vscode/blob/f74e473238aca7b79c08be761d99a0232838ca4c/extensions/markdown-language-features/src/features/foldingProvider.ts#L39-L57

	// private async getRegions(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
	// 	const tokens = await this.engine.parse(document);
	// 	const regionMarkers = tokens.filter(isRegionMarker)
	// 		.map(token => ({ line: token.map[0], isStart: isStartRegion(token.content) }));

	// 	const nestingStack: { line: number, isStart: boolean }[] = [];
	// 	return regionMarkers
	// 		.map(marker => {
	// 			if (marker.isStart) {
	// 				nestingStack.push(marker);
	// 			} else if (nestingStack.length && nestingStack[nestingStack.length - 1].isStart) {
	// 				return new vscode.FoldingRange(nestingStack.pop()!.line, marker.line, vscode.FoldingRangeKind.Region);
	// 			} else {
	// 				// noop: invalid nesting (i.e. [end, start] or [start, end, end])
	// 			}
	// 			return null;
	// 		})
	// 		.filter((region: vscode.FoldingRange | null): region is vscode.FoldingRange => !!region);
	// }

	// private getRegionName(line: string, marker: string): string {
	// 	// Remove first marker
	// 	let name = line.replace(marker, "").trim();
	// 	// Ensure name is not empty
	// 	if (name.length === 0) name = "region";
	// 	// Prepend with the # symbol
	// 	return "# " + name;
	// }
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