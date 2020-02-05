// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const renderer = require('./renderer');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vhdlwrangle" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vhdlwrangle.convertEntityDeclToInstance', function () {
		// Get the current text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			vscode.window.showInformationMessage('No Selection!');
			return;
		}
		if (editor.selections.length > 1)
		{
			vscode.window.showInformationMessage('Command not supported with multiple selection');
			return;
		}

		// Get the selected text
		const text = editor.document.getText(editor.selection);
		if (text.trim().length == 0)
		{
			return;
		}

		try
		{
			// Parse it
			let newVhdl = renderer.renderEntityInstance(parser(tokenizer(text)).parseEntityDecl());

			// Replace it
			editor.edit((builder) => {
				builder.replace(editor.selection, newVhdl);
			});
		}
		catch (err)
		{
			vscode.window.showErrorMessage(err.message);
		}
	});

	context.subscriptions.push(disposable);


	disposable = vscode.commands.registerCommand('vhdlwrangle.convertPortDeclsToSignals', function () {
		// Get the current text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			vscode.window.showInformationMessage('No Selection!');
			return;
		}
		if (editor.selections.length > 1)
		{
			vscode.window.showInformationMessage('Command not supported with multiple selection');
			return;
		}

		// Get the selected text
		const text = editor.document.getText(editor.selection);
		if (text.trim().length == 0)
		{
			return;
		}

		try
		{
			// Parse it
			let newVhdl = renderer.renderSignalDeclarations(parser(tokenizer(text)).parsePortDecls());

			// Replace it
			editor.edit((builder) => {
				builder.replace(editor.selection, newVhdl);
			});
		}
		catch (err)
		{
			vscode.window.showErrorMessage(err.message);
		}
	});

	context.subscriptions.push(disposable);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
