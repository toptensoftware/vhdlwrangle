// Parses a token stream into a set of statements.
// Returns an array of statement definitions
function parse(next)
{
    let token;

    // Get the next token and store in token
    function nextToken()
    {
        token = next();
    }

    // Skip an expected token
    function skipToken(tokenKind)
    {
        // Check it
        if (token.token != tokenKind)
            throw new Error(`syntax error: expected: ${tokenKind} not ${token.token}`);

        // Move on
        nextToken();
    }

    // Check if current token is as specified and if so skip it
    function trySkipToken(tokenKind)
    {
        if (token.token == tokenKind)
        {
            nextToken();
            return true;
        }

        return false;
    }

    function isIdentifier(id)
    {
        return token.token == "identifier" && token.value.toLowerCase() == id.toLowerCase();
    }

    function trySkipIdentifier(id)
    {
        if (!isIdentifier(id))
            return false;
        
        nextToken();
        return true;
    }

    function skipIdentifier(id)
    {
        if (!trySkipIdentifier(id))
            throw new Error(`syntax error: expected: ${id} not ${JSON.stringify(token)}`);
    }

    // Parse a signal, variable, shared variable or constant definition
    function tryParseMemberDecl()
    {
        // Ignore it
        let shared = trySkipIdentifier("SHARED");

        let kind;
        if (trySkipIdentifier("signal"))
            kind = "signalDecl";
        else if (trySkipIdentifier("variable"))
            kind = "variableDecl";
        else if (trySkipIdentifier("constant"))
            kind = "constantDecl";
        else
            return null;

        // Capture port/parameter name
        let name = token.value;
        let pos = token.pos;

        // Skip it and the colon
        skipToken('identifier');
        skipToken(':');

        // Capture
        let type = null;
        let value = "";
        let depth = 0;

        next.enableWhitespace(true);

        while (true)
        {
            if (token.token == 'eof' || (token.token == ')' && depth == 0) || token.token == ';')
                break;

            // Found the assignment?
            if (token.token == ':=')
            {
                type = value;
                value = "";
                nextToken();
                continue;
            }

            // Skip nested brackets
            if (token.token == '(')
                depth++;
            if (token.token == ')')
                depth--;

            if (token.raw)
                value += token.raw;
            else if (token.value)
                value += token.value;
            else
                value += token.token;

            nextToken();
        }

        next.enableWhitespace(false);

        if (type == null)
        {
            type = value;
            value = null;
        }

        if (value)
            value = value.trim();
        if (type)
            type = type.trim();

        return { kind, pos, name, type, value }
    }

    // Parse a signal, variable, shared variable or constant definition
    function tryParseTypeDecl()
    {
        // Ignore it
        if (!trySkipIdentifier("type"))
            return null;

        // Capture port/parameter name
        let name = token.value;
        let pos = token.pos;

        // Skip it and the colon
        skipToken('identifier');
        skipIdentifier('is');

        // Capture
        let definition = "";
        let depth = 0;

        next.enableWhitespace(true);

        while (true)
        {
            if (token.token == 'eof' || (token.token == ')' && depth == 0) || token.token == ';')
                break;

            // Skip nested brackets
            if (token.token == '(')
                depth++;
            if (token.token == ')')
                depth--;

            if (token.raw)
                definition += token.raw;
            else if (token.value)
                definition += token.value;
            else
                definition += token.token;

            nextToken();
        }

        next.enableWhitespace(false);


        if (definition)
            definition = definition.trim();

        return { kind: "typeDefinition", pos, name, definition }
    }

    function parsePortDecl()
    {
        // Capture port/parameter name
        let name = token.value;
        let pos = token.pos;

        let signalName = name;
        if (signalName.startsWith('i_') || signalName.startsWith('o_'))
            signalName = signalName.substr(2);
        else if (signalName.startsWith('io'))
            signalName = signalName.substr(3);
    
        signalName = 's_' + signalName;

        // Skip it and the colon
        skipToken('identifier');
        skipToken(':');

        // Skip port direction
        trySkipIdentifier('IN') || trySkipIdentifier('OUT') || trySkipIdentifier('INOUT');

        // Capture
        let type = null;
        let value = "";
        let depth = 0;

        next.enableWhitespace(true);

        while (true)
        {
            if (token.token == 'eof' || (token.token == ')' && depth == 0) || token.token == ';')
                break;

            // Found the assignment?
            if (token.token == ':=')
            {
                type = value;
                value = "";
                nextToken();
                continue;
            }

            // Skip nested brackets
            if (token.token == '(')
                depth++;
            if (token.token == ')')
                depth--;

            if (token.raw)
                value += token.raw;
            else if (token.value)
                value += token.value;
            else
                value += token.token;

            nextToken();
        }

        next.enableWhitespace(false);

        if (type == null)
        {
            type = value;
            value = null;
        }

        if (value)
            value = value.trim();
        if (type)
            type = type.trim();

        return { kind: "portDecl", pos, name, signalName, type, value }
    }

    function parsePortDecls()
    {
        let decls = [];

        while (true)
        {
            decls.push(parsePortDecl());
            if (!trySkipToken(';'))
                break;
        }

        return decls;
    }

    // Parse the body of a formula definition
    function parseEntityDecl()
    {
        skipIdentifier('ENTITY');

        // Expect name of entity
        let decl = {
            kind: "entityDecl",
            pos: token.pos,
            name: token.value
        }
        skipToken('identifier');

        skipIdentifier('IS');

        if (trySkipIdentifier('GENERIC'))
        {
            if (trySkipToken('('))
            {
                decl.genericDecls = parsePortDecls();
                decl.genericDecls.map(x => x.kind = "parameterDecl" );
                trySkipToken(')');
                trySkipToken(';');
            }
        }

        if (trySkipIdentifier('PORT'))
        {
            if (trySkipToken('('))
            {
                decl.portDecls = parsePortDecls();
                trySkipToken(')');
                trySkipToken(';');
            }
        }

        decl.endPos = token.pos;
        return decl;
    }

    function parseDottedName()
    {
        let parts = [];

        let lastIdToken = null;
        while (token.token == "identifier")
        {
            lastIdToken = token;
            parts.push(token.value);
            nextToken();
            if (!trySkipToken('.'))
                break;
        }

        if (parts.length == 0)
            return null;

        return {
            qualifier: parts.slice(0, parts.length-1).join("."),
            name: parts[parts.length - 1],
            pos: lastIdToken.pos,
        }
    }

    function skipToSemiColon()
    {
        // Skip everything up to the next semicolone
        while (token.token != 'eof' && token.token != ';')
        {
            nextToken();
        }
        if (token.token == ';')
            nextToken();
    }

    function parsePortAssignment()
    {
        let nameToken = token;
        nextToken();

        while (token.token != 'eof' && token.token != '=>')
        {
            nextToken();
        }

        trySkipToken('=>');

        let depth = 0;
        let value = "";

        next.enableWhitespace(true);

        while (true)
        {
            if (token.token == 'eof' || (token.token == ')' && depth == 0) || token.token == ';' || token.token == ',')
                break;

            // Skip nested brackets
            if (token.token == '(')
                depth++;
            if (token.token == ')')
                depth--;

            if (token.raw)
                value += token.raw;
            else if (token.value)
                value += token.value;
            else
                value += token.token;

            nextToken();
        }

        value = value.trim();

        next.enableWhitespace(false);


        return {
            kind: "assignment",
            name: nameToken.value,
            pos: nameToken.pos,
            value,
        }

    }

    function parseMap()
    {
        trySkipIdentifier("MAP");
        if (!trySkipToken('('))
            return [];

        let assignments = [];
        while (token.token != 'eof' && token.token != ')')
        {
            if (token.token == 'identifier')
            {
                assignments.push(parsePortAssignment());
            }
            else
                nextToken();        // WTF?
        }

        trySkipToken(')');
        return assignments;
    }

    function parseEntityInstance(nameToken)
    {
        let pos = nameToken ? nameToken.pos : token.pos;
        skipIdentifier("ENTITY");
        let instanceType = parseDottedName();

        let assignments = [];

        // Parse out the parameter port references
        if (trySkipIdentifier("GENERIC"))
        {
            assignments = assignments.concat(parseMap());
        }

        if (trySkipIdentifier("PORT"))
        {
            assignments = assignments.concat(parseMap());
        }

        assignments.map(x => x.type = instanceType);

        instanceType.kind = "entityTypeReference",

        skipToSemiColon();
        let decl =  {
            kind: "entityInstance",
            pos: pos,
            endPos: token.pos,
            name: nameToken ? nameToken.value : null,
            assignments,
            type: instanceType,
        };

        return decl;
    }

    function parseProcess(nameToken)
    {
        let pos = nameToken ? nameToken.pos : token.pos;
        skipIdentifier("PROCESS");
        while (token.token != 'eof')
        {
            if (trySkipIdentifier("END") && trySkipIdentifier("PROCESS"))
                break;
            nextToken();
        }
        trySkipToken(';');

        return {
            kind: "process",
            pos: pos,
            endPos: token.pos,
            name: nameToken ? nameToken.value : null
        }
    }

    function parseArchitecture()
    {
        // ARCHITECTURE <archType> OF <entity> IS
        nextToken();
        let archType = token.value;
        skipToken("identifier");
        skipIdentifier("of");
        let name = token.value;
        let pos = token.pos;
        skipToken("identifier");
        skipIdentifier('is');

        let members = [];

        // Parse signals
        while (token.token != 'eof' && !isIdentifier("begin"))
        {
            let signal = tryParseMemberDecl();
            if (signal)
            {
                members.push(signal);
                trySkipToken(';');
                continue;
            }

            let type = tryParseTypeDecl();
            if (type)
            {
                members.push(type);
                trySkipToken(';');
                continue;
            }


            nextToken();            // ??? Ignore it
        }

        if (trySkipIdentifier("BEGIN"))
        {
            while (true)
            {
                if (isIdentifier("END"))
                {
                    if (trySkipIdentifier(archType))
                        trySkipToken(';');
                    break;
                }

                if (isIdentifier("entity"))
                {
                    members.push(parseEntityInstance(null));
                    continue;
                }

                if (isIdentifier("process"))
                {
                    members.push(parseProcess(null));
                    continue;
                }

                // Save the name token
                let nameToken = token;
                nextToken();

                if (trySkipToken(':'))
                {
                    if (isIdentifier("entity"))
                    {
                        members.push(parseEntityInstance(nameToken));
                        continue;
                    }
        
                    if (isIdentifier("process"))
                    {
                        members.push(parseProcess(nameToken));
                        continue;
                    }
                }

                skipToSemiColon();
            }
        }


        let decl = {
            kind: "architecture",
            archType,
            name,
            pos,
            endPos: token.pos,
            members,
        }

        return decl;
    }

    function parseDocument()
    {
        let doc = [];
        while (token.token != 'eof')
        {
            if (isIdentifier("entity"))
            {
                doc.push(parseEntityDecl());
            }
            else if (isIdentifier("architecture"))
            {
                doc.push(parseArchitecture());
            }
            else
            {
                nextToken();
            }
        }

        return doc;
    }

    // Get the first token
    nextToken();

    return {
        parseDocument,
        parseEntityDecl,
        parsePortDecls,
    };
}

module.exports = parse;