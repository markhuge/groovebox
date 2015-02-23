var c       = require('../../config'),
    gs      = require('grooveshark'),
    client  = new gs(c.clientUsername, c.clientPassword),
    country = {},
    thru    = require('through2').obj,
    http    = require('http');


module.exports = {
  auth          : auth,
  getArtist     : stream(getArtist),
  startAutoplay : stream(startAutoplay),
  getStreamServer : stream(getStreamServer)
}


function stream (fn) {
  return function (obj) {
    var stream = thru(fn);
    if (obj) stream.write(obj);
    return stream;
  }
}

function auth (cb) {
  client.authenticate(c.userEmail, c.userPassword, function (err,body) {
    if (err) return cb(err);
    getCountry(cb);
  });
}

function getCountry (cb) {
  client.request('getCountry',{}, function (err, state, body) {
    if (err) return cb(err);
    country = body;
    cb();
  });
}



function getArtist (obj, encoding, cb) {
  console.log(obj)
  var self = this;
  client.request('getArtistSearchResults', { query: obj.artist }, function (err, status, body) {
   if (err) return cb(err);
    obj.artist = body.artists[0].ArtistID;
    self.push(obj);
  });
}

function startAutoplay (obj, encoding, cb) {
  var self = this,
      opts = {
        artistIDs: [ obj.artist ],
        songIDs: [],
        autoplayState: obj.autoplay
      };
  
  client.request('startAutoplay', opts, function (err, status, body) {
    if (err) return cb(err);
    obj.songID  = body.nextSong.SongID;
    obj.lowBitRate = false;
    obj.autoplay = body.autoplay;
    obj.nextSong = body.nextSong;
    obj.country = country;
    self.push(obj)
  });
}

function getStreamServer (obj, encoding, cb) {
  var self = this;
  client.request('getStreamKeyStreamServer', obj, function (err, status, body) {
    obj.StreamKey = body.StreamKey;
    obj.streamServerID = body.StreamServerID;
    obj.sessionID = client.sessionID;
    http.get(body.url, function (res) {
      
      var payload = {
        sessionID: client.sessionID,
        streamKey: obj.StreamKey,
        streamServerID: obj.streamServerID
      };
      
      setTimeout(function (){
        client.request('markStreamKeyOver30Secs', payload, console.log);
      }, 30000);
      
      obj.audioStream = res;
      self.push(obj);
    });
  });
}

