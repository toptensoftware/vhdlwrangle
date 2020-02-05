const vscode = require('vscode');
const lineOffsets = require('./lineOffsets');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const navigate = require('./navigate');
const textUtils= require('./textUtils');
const path = require('path');
const fs = require('fs');
const util = require('util');
const glob = util.promisify(require('glob'));


// Give the name of an entity, try to locate it by looking in the same folder as
// the referencing document and any other folders in the workspace
async function findEntitySourceFile(document, entityQualifier, entityName)
{
    // Work out the folders to search
    let foldersToSearch = [];
    if (vscode.workspace.workspaceFolders)
        foldersToSearch = foldersToSearch.concat(vscode.workspace.workspaceFolders.map(x=>x.uri.fsPath));
    if (document && document.fileName)
    {
        let docFolder = path.dirname(document.fileName);
        if (foldersToSearch.indexOf(docFolder) < 0)
            foldersToSearch.unshift(docFolder);
    }

    // Check all folders
    let matches = [];
    for (let i=0; i<foldersToSearch.length; i++)
    {
        let searchSpec =path.join(foldersToSearch[i], "/**/" + entityName + ".vhd");
        matches = matches.concat(await glob(searchSpec));
    }

    // Not found
    return matches.length == 0 ? null : matches[0];
}

// Find an entity or entity member in a source
function findEntityInSource(src, entityQualifier, entityName, memberName)
{
    // Parse the document
    let ast = parser(tokenizer(src)).parseDocument();

    // Locate the entity
    let elEntity = navigate.findElementByName(ast, entityName);
    if (!elEntity || elEntity.kind != "entityDecl")
        return null;

    // Just looking for the entity?
    if (!memberName)
        return elEntity;

    // Locate the member with in this entity
    return navigate.findElementByName(elEntity, memberName);
}

// Check if two paths are the same, handling the differences between the way `glob` returns paths
// on Windows (forward slash) and the paths returned from vscode for open documents (backslash)
function isSamePath(p1, p2)
{
    if (path.sep == '/')
    {
        // Linux.  Everything is forward slash and case sensitive
        return p1 == p2;
    }
    else
    {
        // Windows.  Convert backslashes to forward slashes and compare case insensitive
        return p1.replace(/\\/g, '/').toLowerCase() == p2.replace(/\\/g, '/').toLowerCase();
    }
}

// Given an entity name and option member name, provide a defintion for it
async function provideEntityDefinition(document, entityQualifier, entityName, memberName)
{
    // Locate the file
    let file = await findEntitySourceFile(document, entityQualifier, entityName);
    if (!file)
        return;

    // Is the file already open in an editor?
    let src;
    let uri;
    let openDoc = vscode.workspace.textDocuments.filter(x=> isSamePath(x.fileName, file));
    if (openDoc.length > 0)
    {
        // Yes, try to locate it that way
        src = openDoc[0].getText();
        uri = openDoc[0].uri;

    }
    else
    {
        // No, load the file ourself and try to get it that way
        src = await (util.promisify(fs.readFile))(file, "utf8");
        uri = vscode.Uri.file(file);
    }

    // Locate the element
    let ref = findEntityInSource(src, entityQualifier, entityName, memberName);
    if (!ref)
        return null;

    // Convert to vscode.Range
    let lineMap = lineOffsets.createMap(src);
    let startPos = lineOffsets.fromOffset(lineMap, ref.pos);
    let endPos = lineOffsets.fromOffset(lineMap, ref.pos + ref.name.length);
    return new vscode.Location(uri, new vscode.Range(startPos.line, startPos.character,endPos.line, endPos.character));
}

class VhdlDefinitionProvider
{
    constructor()
    {
    }
    provideDefinition(document, position, token)
    {
        let prom = this.provideDefinitionAsync(document, position, token);
        return prom;
    }

    async provideDefinitionAsync(document, position, token)
    {
        // Get the document's text
        let documentText = document.getText();

        // Create a line map and convert the supplied position into an offset
        let lineMap = lineOffsets.createMap(documentText);
        let offset = lineOffsets.toOffset(lineMap, position.line, position.character);

        // Parse the document
        let ast = parser(tokenizer(documentText)).parseDocument();

        // Check if the position is over something that is external to this file
        // Currently we handle:
        //  1. the left hand side of a port/parameter assignment in an entity instance declaration
        //  2. the type of an entity instance
        let element = navigate.findElementAtPosition(ast, offset);
        if (element != null)
        {
            if (element.kind == "assignment")
            {
                return await provideEntityDefinition(document, element.type.qualifier, element.type.name, element.name);
            }

            if (element.kind == "entityTypeReference")
            {
                return await provideEntityDefinition(document, element.qualifier, element.name, null);
            }
        }

        // Get the identifier the cursor is over
        let id = textUtils.extractIdentifier(documentText, offset);
        if (!id)
            return null;

        // Look in this document for the symbol
        let elTarget = navigate.findElementByName(ast, id);
        if (elTarget != null)
        {
            let startPos = lineOffsets.fromOffset(lineMap, elTarget.pos);
            let endPos = lineOffsets.fromOffset(lineMap, elTarget.pos + elTarget.name.length);
            return new vscode.Location(document.uri, new vscode.Range(startPos.line, startPos.character,endPos.line, endPos.character));
        }
    }
}

module.exports = VhdlDefinitionProvider;