let fs = require('fs');
let tokenizer = require('./tokenizer');
let parser = require('./parser');
let renderer = require('./renderer');
let lineOffsets = require('./lineOffsets');
let navigate = require('./navigate');
let textUtils = require('./textUtils');

let vhdl = fs.readFileSync("C:\\Users\\Brad\\Downloads\\UartRxBuffered.vhd", "utf8");


console.log(textUtils.extractIdentifier(vhdl, 440));

let ast = parser(tokenizer(vhdl)).parseDocument();
console.log(JSON.stringify(ast, 0, 4));

let element = navigate.findElementAtPosition(ast, 2510);

console.log(JSON.stringify(element, 0, 4));
