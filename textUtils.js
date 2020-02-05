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

function extractIdentifier(str, pos)
{
    // Find start
    while (pos > 0 && isIdentifierChar(str[pos-1]))
        pos--;

    let start = pos;
    while (pos < str.length && isIdentifierChar(str[pos]))
        pos++;

    return str.substr(start, pos - start);
}


module.exports = {
    isDigit,
    isLetter,
    isIdentifierChar,
    isIdentifierLeadChar,
    isWhitespace,
    findEol,
    findNextLine,
    extractIdentifier,
}