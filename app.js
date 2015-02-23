var http   = require('http'),
    Router = require('router'),
    router = Router(),
    end    = require('finalhandler'),
    gs     = require('./lib/grooveshark');

router.get('/api/stop', gs.stop);
router.get('/api/status', gs.stat);
router.get('/api/play/:artist', gs.play);


http.createServer(app).listen(8080, function () {
  // login to grooveshark
  gs.auth(function (err) {
    if (err) return console.error(err);
    console.log('Groovebox started on port 8080');
  });
});

function app (req, res) {
  router(req, res, end);
}
