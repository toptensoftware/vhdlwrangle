function renderEntityInstance(decl)
{
    let str = "";
    str += `\te_${decl.entityName} : entity work.${decl.entityName}\n`;
    if (decl.genericDecls) {
        str += `\tgeneric map\n`;
        str += `\t(\n`;
        for (let i=0; i<decl.genericDecls.length; i++)
        {
            let d = decl.genericDecls[i];
            str += `\t\t${d.name} => ${d.name}`;
            if (i < decl.genericDecls.length - 1)
                str += ',';
            str += '\n';
        }
        str += `\t)\n`;
    }
    str += `\tport map\n`;
    str += `\t(\n`;
    for (let i=0; i<decl.portDecls.length; i++)
    {
        let d = decl.portDecls[i];
    
        str += `\t\t${d.name} => ${d.signalName}`;
        if (i < decl.portDecls.length - 1)
            str += ',';
        str += '\n';
    }
    str += `\t);\n`;

    return str;
}

function renderSignalDeclarations(decls)
{
    let str = "";
    for (let i=0; i<decls.length; i++)
    {
        let d = decls[i];
    
        str += `\tsignal ${d.signalName} : ${d.type};\n`;
    }
    return str;
}

module.exports = {
    renderEntityInstance,
    renderSignalDeclarations
}