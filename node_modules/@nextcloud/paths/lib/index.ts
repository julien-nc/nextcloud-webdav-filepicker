/**
 * URI-Encodes a file path but keep the path slashes.
 */
export function encodePath(path: string): string {
    if (!path) {
        return path
    }

    return path
        .split('/')
        .map(encodeURIComponent)
        .join('/')
}

/**
 * Returns the base name of the given path.
 * For example for "/abc/somefile.txt" it will return "somefile.txt"
 */
export function basename(path: string): string {
    return path
        .replace(/\\/g, '/')
        .replace(/.*\//, '')
}

/**
 * Returns the dir name of the given path.
 * For example for "/abc/somefile.txt" it will return "/abc"
 */
export function dirname(path: string): string {
    return path
        .replace(/\\/g, '/')
        .replace(/\/[^\/]*$/, '')
}

/**
 * Join path sections
 */
export function joinPaths(...args: string[]) {
    if (arguments.length < 1) {
        return ''
    }

    // discard empty arguments
    const nonEmptyArgs = args.filter(arg => arg.length > 0)
    if (nonEmptyArgs.length < 1) {
        return ''
    }

    const lastArg = nonEmptyArgs[nonEmptyArgs.length - 1]
    const leadingSlash = nonEmptyArgs[0].charAt(0) === '/'
    const trailingSlash = lastArg.charAt(lastArg.length - 1) === '/';
    const sections = nonEmptyArgs.reduce((acc, section) => acc.concat(section.split('/')), [] as string[])

    let first = !leadingSlash
    const path = sections.reduce((acc, section) => {
        if (section === '') {
            return acc
        }

        if (first) {
            first = false
            return acc + section
        }

        return acc + '/' + section
    }, '')

    if (trailingSlash) {
        // add it back
        return path + '/'
    }
    return path
}

/**
 * Returns whether the given paths are the same, without
 * leading, trailing or doubled slashes and also removing
 * the dot sections.
 */
export function isSamePath(path1: string, path2: string): boolean {
    const pathSections1 = (path1 || '').split('/').filter(p => p !== '.')
    const pathSections2 = (path2 || '').split('/').filter(p => p !== '.')
    path1 = joinPaths.apply(undefined, pathSections1)
    path2 = joinPaths.apply(undefined, pathSections2)

    return path1 === path2
}
