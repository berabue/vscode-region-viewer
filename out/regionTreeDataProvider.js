"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const markers = require("./markers.json");
class RegionTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.findRegions();
    }
    refresh() {
        this.findRegions();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    findRegions() {
        var _a, _b;
        const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        if (document == undefined)
            return;
        let treeRoot = [];
        let regionStack = [];
        if (document.languageId in markers) {
            // Create Generally Typed Markers, so that we can
            // index them using languageID strings
            const GTMarkers = markers;
            const startRegExp = new RegExp(GTMarkers[document.languageId].start);
            const endRegExp = new RegExp(GTMarkers[document.languageId].end);
            const isRegionStart = (t) => startRegExp.test(t);
            const isRegionEnd = (t) => endRegExp.test(t);
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
                        (_b = parentDep.children) === null || _b === void 0 ? void 0 : _b.push(dep);
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
    getName(input, match) {
        if (match && match.groups) {
            const groupIDs = [
                "name",
                "nameAlt"
            ];
            // Look into capture groups
            for (const groupID of groupIDs) {
                if (groupID in match.groups && match.groups[groupID] !== undefined) {
                    const name = match.groups[groupID].trim();
                    if (name.length > 0)
                        return "# " + name;
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
exports.RegionTreeDataProvider = RegionTreeDataProvider;
class Dependency extends vscode.TreeItem {
    constructor(label, line) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.children = [];
        this.command = {
            title: '',
            command: 'region-viewer.reveal',
            arguments: [
                line
            ]
        };
    }
}
//# sourceMappingURL=regionTreeDataProvider.js.map