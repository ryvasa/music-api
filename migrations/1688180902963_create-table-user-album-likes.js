exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_album_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      references: 'users(id)',
    },
    album_id: {
      type: 'VARCHAR(50)',
      references: 'albums(id)',
    },
    createdAt: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updatedAt: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createConstraint('user_album_likes', 'unique_user_album', {
    unique: ['user_id', 'album_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('user_album_likes', 'unique_user_album');
  pgm.dropTable('user_album_likes');
};
