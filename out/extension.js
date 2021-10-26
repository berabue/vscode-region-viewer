"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const regionTreeDataProvider_1 = require("./regionTreeDataProvider");
function activate(context) {
    const regionTreeDataProvider = new regionTreeDataProvider_1.RegionTreeDataProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('regionViewer', regionTreeDataProvider));
    // If a TreeView item is selected, the cursor moves to that location.
    context.subscriptions.push(vscode.commands.registerCommand('region-viewer.reveal', (line) => {
        const editor = vscode.window.activeTextEditor;
        if (editor == undefined)
            return;
        const pos = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
    }));
    // When the document is changed, the list of regions in the document is checked and updated.
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(() => {
        regionTreeDataProvider.refresh();
    }));
    //
    context.subscriptions.push(vscode.commands.registerCommand('region-viewer.activeDocumentLanguageId', () => {
        var _a, _b, _c;
        var languageId = (_c = (_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document) === null || _b === void 0 ? void 0 : _b.languageId) !== null && _c !== void 0 ? _c : 'Unknown language';
        vscode.window.showInformationMessage(`Language ID for active document: ${languageId}`);
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map