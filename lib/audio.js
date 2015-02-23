var lame    = require('lame'),
    Speaker = require('speaker'),
    opts    = {
      channels: 2,
      bitDepth: 16,
      samplerate: 44100
    };

exports.speaker = new Speaker(opts);
exports.decoder = lame.Decoder();
