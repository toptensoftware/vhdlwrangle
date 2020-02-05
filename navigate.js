function doesContain(element, pos)
{
    if (element.pos && element.endPos)
    {
        return pos >= element.pos && pos < element.endPos;
    }

    if (element.pos && element.name)
    {
        return pos >= element.pos && pos < element.pos + element.name.length;
    }

    return false;
}

function getChildElements(element)
{
    if (element.kind == "architecture")
        return element.members;
    if (element.kind == "entityDecl")
    {
        let children = [];
        if (element.genericDecls)
            children = children.concat(element.genericDecls);
        if (element.portDecls)
            children = children.concat(element.portDecls);
        return children;
    }
    if (element.kind == "entityInstance")
    {
        return element.assignments;
    }
}

// Given a tree of elements, find the element containing the specified position
function findElementAtPosition(element, pos)
{
    // Check all elements of an array
    if (Array.isArray(element))
    {
        for (let i=0; i<element.length; i++)
        {
            if (doesContain(element[i], pos))
                return findElementAtPosition(element[i], pos);
        }
    }

    // Does this block element contain it?
    if (!doesContain(element, pos))
        return false;

    // Check child elements
    let children = getChildElements(element);
    if (children != null)
    {
        for (let i=0; i<children.length; i++)
        {
            let child = findElementAtPosition(children[i], pos);
            if (child)
            {
                return child;
            }
        }
    }

    // Check for entity instance type name
    if (element.kind == "entityInstance")
    {
        if (doesContain(element.type, pos))
            return element.type;
    }

    return element;
}

function findElementByName(element, name)
{
    if (element.kind == "assignment")
        return null;
    if (element.kind == "entityTypeReference")
        return null;
    // Check all elements of an array
    if (Array.isArray(element))
    {
        for (let i=0; i<element.length; i++)
        {
            let elFound = findElementByName(element[i], name);
            if (elFound)
                return elFound
        }
    }

    if (element.name == name)
        return element;

    let children = getChildElements(element);
    if (children != null)
    {
        for (let i=0; i<children.length; i++)
        {
            let elFound = findElementByName(children[i], name);
            if (elFound)
                return elFound;
        }
    }

    return null;
}


module.exports = {
    findElementAtPosition,
    findElementByName,
}