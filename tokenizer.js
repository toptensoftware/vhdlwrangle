let textUtils = require('./textUtils')

// Tokenizes a string into an expression tokens.
// Returns a function that each time called, returns the next token
function tokenize(strIn)
{
    let p = 0;
    let str = strIn + '\0';
    let whitespaceMode = false;

    // Gets the next token
    function next()
    {
        // Skip leading whitespace and comments
        let save = p;
        while (true)
        {
            // Skip leading line space
            while (textUtils.isWhitespace(str[p]))
                p++;

            // Comment
            if (str[p] == '-' && str[p+1] == '-')
            {
                p = textUtils.findNextLine(str, p);
                continue;
            }
            break;
        }
        if (p > save && whitespaceMode)
        {
            return { pos: save, token: " " };
        }

        // Eof of file?
        if (str[p]=='\0' || p==str.length)
        {
            return { pos: p, token: 'eof' }
        }

        // Is it an identifier?
        if (textUtils.isIdentifierLeadChar(str[p]))
        {
            // Skip it
            let start = p;
            while (textUtils.isIdentifierChar(str[p]))
                p++;

            // Extract it
            let identifier = str.substr(start, p-start);

            // Return token
            return {
                pos: start,
                token: 'identifier',
                value: identifier,
            }
        }

        // Characters
        switch (str[p])
        {
            case '(':
            case ')':
            case ',':
            case ';':
            case '.':
                let ch = str[p];
                p++;
                return {
                    pos: p-1,
                    token: ch
                }

            case ':':
                p++;
                if (str[p] == '=')
                {
                    p++;
                    return { pos: p-2, token: ":="}
                }
                return { pos: p-1, token: ":" }

            case '<':
                p++;
                if (str[p] == '=')
                {
                    p++;
                    return { pos: p-2, token: "<="}
                }
                return { pos: p-1, token: ":" }

            case '=':
                p++;
                if (str[p] == '>')
                {
                    p++;
                    return { pos: p-2, token: "=>"}
                }
                return { pos: p-1, token: "=" }
            }

        // String?
        if (str[p] == '\"' || str[p] == '\'')
        {
            let delim = str[p];
            let start = p;
            p++;

            while (str[p] != delim)
            {
                if (str[p] == '\0')
                    throw new Error("Unterminated string literal");

                p++;
            }

            // Skip trailing delimiter
            p++;

            // Extract the raw string
            let raw = str.substr(start, p-start);

            // Return as a literal
            return {
                pos: start,
                token: 'other',
                raw
            }
        }

        // Some other unexpected character
        p++;
        return {
            pos: p-1,
            token: 'other',
            raw: str[p-1]
        }
    }

    next.enableWhitespace = function(enable)
    {
        whitespaceMode = enable;
    }

    return next;
}


module.exports = tokenize;


