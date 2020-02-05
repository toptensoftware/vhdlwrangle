const vscode = require('vscode');
const lineOffsets = require('./lineOffsets');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const navigate = require('./navigate');
const textUtils= require('./textUtils');
const path = require('path');

class VhdlDefinitionProvider
{
    constructor()
    {
    }
    provideDefinition(document, position, token)
    {
        let documentText = document.getText();
        let lineMap = lineOffsets.createMap(documentText);
        let offset = lineOffsets.toOffset(lineMap, position.line, position.character);

        let id = textUtils.extractIdentifier(documentText, offset);

        let ast = parser(tokenizer(documentText)).parseDocument();

        // Look for a port assignment at this offset
        let element = navigate.findElementAtPosition(ast, offset);
        if (element != null)
        {
            if (element.kind == "assignment")
            {
                let foldersToSearch = [];

                if (vscode.workspace.workspaceFolders)
                    foldersToSearch = foldersToSearch.concat(vscode.workspace.workspaceFolders.map(x=>x.uri.fsPath));

                if (document.fileName)
                {
                    let docFolder = path.dirname(document.fileName);
                    if (foldersToSearch.indexOf(docFolder) < 0)
                        foldersToSearch.unshift(docFolder);
                }
                /*
                let entityTypeNAme = element.type.name;
                let entityTypeQualifiier = element.type.qualifier;
                let portOrParameterName = element.name;
                */
               
                let docs = vscode.workspace.textDocuments;

                vscode.window.showInformationMessage(JSON.stringify(element));
                return;
            }

            if (element.kind == "entityTypeReference")
            {
                vscode.window.showInformationMessage(JSON.stringify(element));
                return;
            }
        }

        // Look in this document for the symbol
        let elTarget = navigate.findElementByName(ast, id);
        if (elTarget != null)
        {
            let startPos = lineOffsets.fromOffset(lineMap, elTarget.pos);
            let endPos = lineOffsets.fromOffset(lineMap, elTarget.pos + elTarget.name.length);
            let loc = new vscode.Location(document.uri, new vscode.Range(startPos.line, startPos.character,endPos.line, endPos.character));
            return loc;
        }
    }
}

module.exports = VhdlDefinitionProvider;