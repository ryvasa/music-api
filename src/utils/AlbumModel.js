const albumModel = ({ albumId, albumName, albumYear }) => ({
  id: albumId,
  name: albumName,
  year: albumYear,
});

module.exports = { albumModel };
