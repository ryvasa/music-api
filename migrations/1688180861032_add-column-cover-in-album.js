exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('albums', {
    cover: { type: 'string' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('albums', 'cover');
};
