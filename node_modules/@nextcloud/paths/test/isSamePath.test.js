import {isSamePath} from '../lib/index'

describe('isSamePath', function() {
    it('recognizes empty paths are equal', function() {
        expect(isSamePath('', '')).toEqual(true);
        expect(isSamePath('/', '')).toEqual(true);
        expect(isSamePath('//', '')).toEqual(true);
        expect(isSamePath('/', '/')).toEqual(true);
        expect(isSamePath('/', '//')).toEqual(true);
    });
    it('recognizes path with single sections as equal regardless of extra slashes', function() {
        expect(isSamePath('abc', 'abc')).toEqual(true);
        expect(isSamePath('/abc', 'abc')).toEqual(true);
        expect(isSamePath('//abc', 'abc')).toEqual(true);
        expect(isSamePath('abc', '/abc')).toEqual(true);
        expect(isSamePath('abc/', 'abc')).toEqual(true);
        expect(isSamePath('abc/', 'abc/')).toEqual(true);
        expect(isSamePath('/abc/', 'abc/')).toEqual(true);
        expect(isSamePath('/abc/', '/abc/')).toEqual(true);
        expect(isSamePath('//abc/', '/abc/')).toEqual(true);
        expect(isSamePath('//abc//', '/abc/')).toEqual(true);

        expect(isSamePath('abc', 'def')).toEqual(false);
        expect(isSamePath('/abc', 'def')).toEqual(false);
        expect(isSamePath('//abc', 'def')).toEqual(false);
        expect(isSamePath('abc', '/def')).toEqual(false);
        expect(isSamePath('abc/', 'def')).toEqual(false);
        expect(isSamePath('abc/', 'def/')).toEqual(false);
        expect(isSamePath('/abc/', 'def/')).toEqual(false);
        expect(isSamePath('/abc/', '/def/')).toEqual(false);
        expect(isSamePath('//abc/', '/def/')).toEqual(false);
        expect(isSamePath('//abc//', '/def/')).toEqual(false);
    });
    it('recognizes path with multiple sections as equal regardless of extra slashes', function() {
        expect(isSamePath('abc/def', 'abc/def')).toEqual(true);
        expect(isSamePath('/abc/def', 'abc/def')).toEqual(true);
        expect(isSamePath('abc/def', '/abc/def')).toEqual(true);
        expect(isSamePath('abc/def/', '/abc/def/')).toEqual(true);
        expect(isSamePath('/abc/def/', '/abc/def/')).toEqual(true);
        expect(isSamePath('/abc/def/', 'abc/def/')).toEqual(true);
        expect(isSamePath('//abc/def/', 'abc/def/')).toEqual(true);
        expect(isSamePath('//abc/def//', 'abc/def/')).toEqual(true);

        expect(isSamePath('abc/def', 'abc/ghi')).toEqual(false);
        expect(isSamePath('/abc/def', 'abc/ghi')).toEqual(false);
        expect(isSamePath('abc/def', '/abc/ghi')).toEqual(false);
        expect(isSamePath('abc/def/', '/abc/ghi/')).toEqual(false);
        expect(isSamePath('/abc/def/', '/abc/ghi/')).toEqual(false);
        expect(isSamePath('/abc/def/', 'abc/ghi/')).toEqual(false);
        expect(isSamePath('//abc/def/', 'abc/ghi/')).toEqual(false);
        expect(isSamePath('//abc/def//', 'abc/ghi/')).toEqual(false);
    });
    it('recognizes path entries with dot', function() {
        expect(isSamePath('.', '')).toEqual(true);
        expect(isSamePath('.', '.')).toEqual(true);
        expect(isSamePath('.', '/')).toEqual(true);
        expect(isSamePath('/.', '/')).toEqual(true);
        expect(isSamePath('/./', '/')).toEqual(true);
        expect(isSamePath('/./', '/.')).toEqual(true);
        expect(isSamePath('/./', '/./')).toEqual(true);
        expect(isSamePath('/./', '/./')).toEqual(true);

        expect(isSamePath('a/./b', 'a/b')).toEqual(true);
        expect(isSamePath('a/b/.', 'a/b')).toEqual(true);
        expect(isSamePath('./a/b', 'a/b')).toEqual(true);
    });
});