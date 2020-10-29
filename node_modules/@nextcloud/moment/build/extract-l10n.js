const { GettextExtractor, JsExtractors } = require('gettext-extractor');

let extractor = new GettextExtractor();

extractor
    .createJsParser([
        JsExtractors.callExpression('gt.gettext', {
            arguments: {
                text: 0,
                context: 1
            }
        }),
    ])
    .parseFilesGlob('./lib/**/*.@(ts|js)');

extractor.savePotFile('./l10n/messages.pot');

extractor.printStats();
