var config = require('./config'),
    gs = require('grooveshark'),
    client = new gs(config.clientUsername, config.clientPassword),
    lame = require('lame'),
    Speaker = require('speaker'),
    fs = require('fs'),
    http = require('http'),
    express = require('express');

var app = express();
var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};
var nextSong, myCountry;


app.get('/api/stop', function (req, res) {
  // app.locals.jukebox.stop();
  res.send('stop the music');
});

app.get('/api/status', function (req, res) {
  res.send(nextSong);
});

app.get('/api/play/:artist', function (request, response) {
  client.request('getArtistSearchResults', {query: request.params.artist, limit: 1}, function(err, status, body) {
    console.log(err, status, body);
    var artist = body.artists[0].ArtistID;

    playMusic(undefined, artist, function(data) {
      console.log(data);
      response.send(data);
    });

  });
});


// var Jukebox = (function (autoplayState, artist, cb) {
//   var instance;
//
//   function createInstance() {
//     return {
//       decoder: lame.Decoder(),
//       speaker: new Speaker(audioOptions)
//     }
//   };
//
//   return {
//     getInstance: function() {
//       if(!instance) {
//         instance = createInstance();
//       }
//       return instance;
//     },
//     stop: function() {
//       instance.decoder = undefined;
//       instance.speaker = undefined;
//     }
//   };
// })();

function playMusic(autoplayState, artist, cb) {
  var decoder = lame.Decoder();
  var speaker = new Speaker(audioOptions);

  client.request('startAutoplay', {"artistIDs":[artist], "songIDs":[], "autoplayState": autoplayState}, function(err, status, body) {
    var parameters = {
      songID: body.nextSong.SongID,
      country: myCountry,
      lowBitrate: false
    };

    autoplayState = body.autoplayState;
    nextSong = body.nextSong;

    client.request('getStreamKeyStreamServer', parameters, function(err, status, body) {
      var getStreamKeyStreamServer = body;
      http.get(body.url, function(res) {
        var playedFor30;
        setTimeout(function() {
          var payload = {
            streamKey: getStreamKeyStreamServer.StreamKey,
            streamServerID: getStreamKeyStreamServer.StreamServerID,
            sessionID: client.sessionID
          };

          client.request('markStreamKeyOver30Secs', payload, function(err, status, body) {
            playedFor30 = true;
          });

        }, 30000);

        if(cb) cb(nextSong);

        res.pipe(decoder).pipe(speaker);
        speaker.on('flush', function(){
          console.log("song is done");
          var payload = {
            sessionID: client.sessionID,
            songID: nextSong.SongID,
            streamKey: getStreamKeyStreamServer.StreamKey,
            streamServerID: getStreamKeyStreamServer.StreamServerID
          };

          if(playedFor30) {
            client.request('markSongComplete', payload, function(err, status, body) {
              playMusic(autoplayState, artist);
            });
          }
        });
      })
    })
  });
};

var server = app.listen(3000, function() {
  console.log("listening");
  client.authenticate(config.userEmail, config.userPassword, function(err, body) {
    if(!err) {
      client.request('getCountry', {}, function(err, status, body) {
        myCountry = body;
        // app.locals.jukebox = Jukebox.getInstance();
      })
    }
  });
});
