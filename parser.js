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

    function trySkipIdentifier(id)
    {
        if (token.token != "identifier" || token.value.toLowerCase() != id.toLowerCase())
            return false;
        
        nextToken();
        return true;
    }

    function skipIdentifier(id)
    {
        if (!trySkipIdentifier(id))
            throw new Error(`syntax error: expected: ${id} not ${JSON.stringify(token)}`);
    }

    function parsePortDecl()
    {
        // Capture port/parameter name
        let name = token.value;

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

        return { name, signalName, type, value }
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
            entityName: token.value
        }
        skipToken('identifier');

        skipIdentifier('IS');

        if (trySkipIdentifier('GENERIC'))
        {
            skipToken('(');
            decl.genericDecls = parsePortDecls();
            skipToken(')');
            skipToken(';');
        }

        skipIdentifier('PORT');
        skipToken('(');
        decl.portDecls = parsePortDecls();
        skipToken(')');
        skipToken(';');

        return decl;
    }

    // Get the first token
    nextToken();

    return {
        parseEntityDecl,
        parsePortDecls,
    };
}

module.exports = parse;