import * as vscode from 'vscode';
import { RegionTreeDataProvider } from './regionTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
	const regionTreeDataProvider = new RegionTreeDataProvider();
	context.subscriptions.push(vscode.window.registerTreeDataProvider('regionViwer', regionTreeDataProvider));

	// If a TreeView item is selected, the cursor moves to that location.
	context.subscriptions.push(vscode.commands.registerCommand('region-viewer.reveal', (line) =>
	{
		const editor = vscode.window.activeTextEditor;
		if (editor == undefined)
			return;
			
		const pos = new vscode.Position(line, 0);
		editor.selection = new vscode.Selection(pos, pos);
		editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
	}));

	// When the document is changed, the list of regions in the document is checked and updated.
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(() =>
	{
		regionTreeDataProvider.refresh();
	}));
}

export function deactivate() {}
