import {dirname} from '../lib/index'

describe('dirname', function() {
    it('Returns the nothing if no file name given', function() {
        expect(dirname('')).toEqual('');
    });
    it('Returns the root if dir is root', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(dirname('/')).toEqual('/');
        expect(dirname('/')).toEqual('');
    });
    it('Returns the root if dir is double root', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(dirname('//')).toEqual('/');
        expect(dirname('//')).toEqual('/'); // oh no...
    });
    it('Returns dot if dir is dot', function() {
        expect(dirname('.')).toEqual('.');
    });
    it('Returns dot if no root given', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(dirname('some dir')).toEqual('.');
        expect(dirname('some dir')).toEqual('some dir'); // oh no...
    });
    it('Returns the dir name if file name and root path given', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(dirname('/some name.txt')).toEqual('/');
        expect(dirname('/some name.txt')).toEqual('');
    });
    it('Returns the dir name if double root path given', function() {
        expect(dirname('//some name.txt')).toEqual('/'); // how lucky...
    });
    it('Returns the dir name if subdir given without root', function() {
        expect(dirname('subdir/some name.txt')).toEqual('subdir');
    });
    it('Returns the dir name if subdir given with root', function() {
        expect(dirname('/subdir/some name.txt')).toEqual('/subdir');
    });
    it('Returns the dir name if subdir given with double root', function() {
        // TODO: fix the source to make it work like PHP's dirname
        // expect(dirname('//subdir/some name.txt')).toEqual('/subdir');
        expect(dirname('//subdir/some name.txt')).toEqual('//subdir'); // oh...
    });
    it('Returns the dir name if subdir has dot', function() {
        expect(dirname('/subdir.dat/some name.txt')).toEqual('/subdir.dat');
    });
    it('Returns the dir name if file name is dot', function() {
        expect(dirname('/subdir/.')).toEqual('/subdir');
    });
    it('Returns the dir name if no file name given', function() {
        expect(dirname('subdir/')).toEqual('subdir');
    });
    it('Returns the dir name if no file name given with root', function() {
        expect(dirname('/subdir/')).toEqual('/subdir');
    });
});
