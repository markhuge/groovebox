var s       = require('./streams'),
    end     = require('stream-callback'),
    country = {},
    audio   = require('../audio'),
    template = require('./template');

module.exports = {
  auth   : s.auth,
  play   : play,
  stop   : stop,
  stat   : stat
};

function play (req, res) {
  
  console.log('Requesting: ', req.params.artist);
  s.getArtist({ artist: req.params.artist })
    .pipe(s.startAutoplay())
    .pipe(s.getStreamServer())
    .pipe(end(response));
    
   function response (obj) {
     obj.audioStream.pipe(audio.decoder).pipe(audio.speaker);
     res.end(template(obj.nextSong));
   }

}
function stop (req, res) {}
function stat (req, res) {}
