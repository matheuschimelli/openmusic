const express = require('express');
const app = express();
const http = require('http');
const request = require("request")
const bodyParser = require('body-parser');
const server = http.createServer(app);

const downloadController = require('./controllers/download');
const betaController = require('./controllers/betaDownload');


const config = {
    path: '/status',
    title: 'OpenMusic Status'
}
app.set('port', (process.env.PORT || 8080))
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(require('express-status-monitor')(config));

app.use(express.static(__dirname + '/public'));


app.on('uncaughtException', function(err) {
    console.log("erro desconhecido, servidor quebrado")
    console.log(err)
});

app.post('/download/api', downloadController.download);
app.post('/api/beta/download', betaController.getDownload);


app.get('/', function(request, response) {
    response.render('pages/index', {
        title: 'Home - OpenDownloader'
    })

})

app.get('/beta', function(request, response) {
    response.render('pages/beta', {
        title: '#Ultra beta secret# '
    })

})
app.get('/app', function(req, res) {
    res.render('pages/app', {
        title: 'App - Beat Music'
    })
})
app.get('/logs', function(req, res) {
    res.render('pages/logs', {
        title: 'Logs - Beat Music'
    })
})

app.get('/api/:query', function(req, res) {

    var iTunesAPI = "https://itunes.apple.com/search?term=" + req.params.query + "&media=music";
    request({
        url: iTunesAPI,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36',
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            //console.log(json)
            res.json(json)
        }
    })

})
app.get('/img/:img', function(req, res) {

    var url = req.params.img;
    req.pipe(request(url)).pipe(res)

})
server.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
