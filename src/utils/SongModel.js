const songModel = ({ id, title, year, performer, genre, duration }) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
});

module.exports = { songModel };
