var express = require("express");
var i18n = require('i18n-abide');
//var logfmt = require("logfmt");
//var compression = require('compression');
//var bodyParser = require('body-parser');

var app = express();

app.engine('html', require('ejs').renderFile);

app.set('view engine', 'ejs');
app.set('views', './assets/views');

app.use(i18n.abide({
    supported_languages: ['en-US', 'it'],
    default_lang: 'en-US',
    translation_directory: 'assets/i18n',
    translation_type: 'plist'
}));

app.use(express.static(__dirname + '/assets'));

//app.use(compression());
//app.use(bodyParser.urlencoded({
//    extended: true
//}));
//app.use(bodyParser.json())
//app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
    res.render('index');
});

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
    console.log("Listening on " + port);
});