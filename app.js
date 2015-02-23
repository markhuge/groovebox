var config = require('./config'),
    gs = require('grooveshark'),
    client = new gs(config.clientUsername, config.clientPassword),
    lame = require('lame'),
    Speaker = require('speaker'),
    fs = require('fs'),
    http = require('http');

console.log(config);

var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};

client.authenticate(config.userEmail, config.userPassword, function(err, body) {

  client.request('getArtistSearchResults', {query: process.argv[2], limit: 1}, function(err, status, body) {
    var artist = body.artists[0].ArtistID;

    client.request('getCountry', {}, function(err, status, body) {
      var myCountry = body;

      function playMusic(autoplayState) {
        var decoder = lame.Decoder();
        var speaker = new Speaker(audioOptions);

        client.request('startAutoplay', {"artistIDs":[artist], "songIDs":[], "autoplayState": autoplayState}, function(err, status, body) {
          var parameters = {
            songID: body.nextSong.SongID,
            country: myCountry,
            lowBitrate: false
          };

          console.log(body);
          autoplayState = body.autoplayState;
          var nextSong = body.nextSong;

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
                  console.log("markStreamKeyOver30Secs: ", body);
                  playedFor30 = true;
                });

              }, 30000);

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
                    console.log(err);
                    console.log(status);
                    console.log(body);
                    playMusic(autoplayState);
                  });
                }
              });
            })
          })
        });
      };
      playMusic();
    });
  });
});
