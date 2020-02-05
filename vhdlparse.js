let fs = require('fs');
let tokenizer = require('./tokenizer');
let parser = require('./parser');
let renderer = require('./renderer');

let vhdl = fs.readFileSync("C:\\Users\\Brad\\Downloads\\UartRxBuffered.vhd", "utf8");

// Find the "entity" declaration
let entityMatch = vhdl.match(/ENTITY\s/i);
if (!entityMatch)
    throw new Error("Entity declarations not found");

// Strip off everything before the entity declaration
let nextToken = tokenizer(vhdl.substr(entityMatch.index));
let decl = parser(nextToken).parseEntityDecl();
let str = renderer.renderEntityInstance(decl);

console.log(str);

/*
let nextToken = tokenizer(vhdl);
let decls = parser(nextToken).parsePortDecls();

let str = renderer.renderSignalDeclarations(decls);
console.log(str);
*/