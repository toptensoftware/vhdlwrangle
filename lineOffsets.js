// Create a line offset map for string "str"
function createMap(str)
{
    let map = [ 0 ];

    for (let i=0; i<str.length; i++)
    {
        if (str[i] =='\r')
        {
            if (i+1<str.length && str[i+1] == '\n')
            {
                i++;
            }
        }
        else if (str[i] == '\n')
        {
        }
        else
        {
            continue;
        }

        map.push(i+1);
    }

    if (map[map.length-1] != str.length)
        map.push(str.length);

    return map;
}

function toOffset(map, line, character)
{
    // Before start?
    if (line < 0)
        return 0;

    // Past end?
    if (line >= map.length)
        return map[map.length-1];

    // Convert to offset
    let offset = map[line] + character;

    // Past end of line?
    if (offset > map[line + 1])
        return map[line+1];

    // Done
    return offset;
}

function fromOffset(map, offset)
{
    for (let i=1; i<map.length; i++)
    {
        if (offset < map[i])
        {
            return {
                line: i-1,
                character: offset - map[i-1],
            }
        }
    }

    return {
        line: map.length-1,
        character: 0,
    }
}


module.exports = {
    createMap,
    toOffset,
    fromOffset,
}
