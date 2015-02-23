module.exports = function (obj) {
  return '<h1>' + obj.ArtistName + ' - ' + obj.SongName + '</h1><p><img src="http://beta.grooveshark.com/static/amazonart/l' + obj.CoverArtFilename.replace(/^\//g, '') + '" />'
}
