// Check if element contains the specified position
function doesContain(element, pos)
{
    // If it's a block element it'll have a start and end position
    if (element.pos && element.endPos)
    {
        return pos >= element.pos && pos < element.endPos;
    }

    // Most identifiers will have position and the length can be found from the length of the identifier
    if (element.pos && element.name)
    {
        return pos >= element.pos && pos < element.pos + element.name.length;
    }

    // Something else, doesn'match
    return false;
}

// Get the child elements of an element
function getChildElements(element)
{
    // Architectures have members
    if (element.kind == "architecture")
        return element.members;

    // Entity declarations have generic and port declarations
    if (element.kind == "entityDecl")
    {
        let children = [];
        if (element.genericDecls)
            children = children.concat(element.genericDecls);
        if (element.portDecls)
            children = children.concat(element.portDecls);
        return children;
    }

    // Entity instances have assignments (which includes ports and parameters)
    if (element.kind == "entityInstance")
    {
        return element.assignments;
    }
}

// Given a tree of elements, find the element containing the specified position
function findElementAtPosition(element, pos)
{
    // Is it an array, check them all
    if (Array.isArray(element))
    {
        for (let i=0; i<element.length; i++)
        {
            if (doesContain(element[i], pos))
                return findElementAtPosition(element[i], pos);
        }
    }

    // Is it within this element
    if (!doesContain(element, pos))
        return false;

    // If it's a block element, it might have children, recurse down.
    let children = getChildElements(element);
    if (children != null)
    {
        for (let i=0; i<children.length; i++)
        {
            let child = findElementAtPosition(children[i], pos);
            if (child)
                return child;
        }
    }

    // If it's an entity instance, check its type
    if (element.kind == "entityInstance")
    {
        if (doesContain(element.type, pos))
            return element.type;
    }

    // Not in a child, just return this element
    return element;
}

// Find an element by name
function findElementByName(element, name)
{
    // Don't check reference types
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

    // Is it this element?
    if (element.name == name)
        return element;

    // No, check child elements
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

    // Not found
    return null;
}


module.exports = {
    findElementAtPosition,
    findElementByName,
}