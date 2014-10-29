'use strict';

var i18n = require('i18n-abide');

module.exports = function(app) {

    app.use(i18n.abide({
        supported_languages: ['en-US', 'it'],
        default_lang: 'en-US',
        translation_directory: 'assets/i18n',
        translation_type: 'plist'
    }));
}