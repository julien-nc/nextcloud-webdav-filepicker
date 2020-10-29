import {basename} from '../lib/index'

describe('basename', function() {
    it('Returns the nothing if no file name given', function() {
        expect(basename('')).toEqual('');
    });
    it('Returns the nothing if dir is root', function() {
        expect(basename('/')).toEqual('');
    });
    it('Returns the same name if no path given', function() {
        expect(basename('some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if root path given', function() {
        expect(basename('/some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if double root path given', function() {
        expect(basename('//some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if subdir given without root', function() {
        expect(basename('subdir/some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if subdir given with root', function() {
        expect(basename('/subdir/some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if subdir given with double root', function() {
        expect(basename('//subdir/some name.txt')).toEqual('some name.txt');
    });
    it('Returns the base name if subdir has dot', function() {
        expect(basename('/subdir.dat/some name.txt')).toEqual('some name.txt');
    });
    it('Returns dot if file name is dot', function() {
        expect(basename('/subdir/.')).toEqual('.');
    });
    // TODO: fix the source to make it work like PHP's basename
    it('Returns the dir itself if no file name given', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(basename('subdir/')).toEqual('subdir');
        expect(basename('subdir/')).toEqual('');
    });
    it('Returns the dir itself if no file name given with root', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(basename('/subdir/')).toEqual('subdir');
        expect(basename('/subdir/')).toEqual('');
    });
});
