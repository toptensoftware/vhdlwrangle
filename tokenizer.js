
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
            while (isWhitespace(str[p]))
                p++;

            // Comment
            if (str[p] == '-' && str[p+1] == '-')
            {
                p = findNextLine(str, p);
                continue;
            }
            break;
        }
        if (p > save && whitespaceMode)
        {
            return { token: " " };
        }

        // Eof of file?
        if (str[p]=='\0' || p==str.length)
        {
            return { token: 'eof' }
        }

        // Is it an identifier?
        if (isIdentifierLeadChar(str[p]))
        {
            // Skip it
            let start = p;
            while (isIdentifierChar(str[p]))
                p++;

            // Extract it
            let identifier = str.substr(start, p-start);

            // Return token
            return {
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
                let ch = str[p];
                p++;
                return {
                    token: ch
                }

            case ':':
                p++;
                if (str[p] == '=')
                {
                    p++;
                    return { token: ":=" }
                }
                return { token: ":" }

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
                token: 'other',
                raw
            }
        }

        // Some other unexpected character
        p++;
        return {
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

// Check if whitespace
function isWhitespace(char)
{
    return char == ' ' || char == '\t' || char == '\r' || char == '\n';
}

// Find the end of a line, returns new position
function findEol(str, p)
{
    while (p < str.length && str[p] != '\0' && str[p] != '\n' && str[p] != '\r')
        p++;
    return p;
}

// Find the next line, returns new position
function findNextLine(str, p)
{
    p = findEol(str, p);
    if (str[p] == '\r')
        p++;
    if (str[p] == '\n')
        p++;
    return p;
}

// Is character a digit?
function isDigit(ch)
{
    return ch >= '0' && ch <= '9';
}

// Is character a letter?
function isLetter(ch)
{
    return (ch>='a' && ch <='z') || (ch >= 'A' && ch <= 'Z')
}

// Is character a valid identifier character
function isIdentifierChar(ch)
{
    return isDigit(ch) || isLetter(ch) || ch == '_';
}

// Is character a valad leading identifier character
function isIdentifierLeadChar(ch)
{
    return isLetter(ch) || ch == '_';
}


module.exports = tokenize;


