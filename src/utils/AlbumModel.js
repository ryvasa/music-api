const albumModel = ({ albumId, albumName, albumYear, cover }) => ({
  id: albumId,
  name: albumName,
  year: albumYear,
  coverUrl: cover,
});

module.exports = { albumModel };
