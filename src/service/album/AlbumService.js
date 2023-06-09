const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const { albumModel } = require('../../utils/AlbumModel');
const NotFoundError = require('../../exceptions/NotFoundError');
const { nanoid } = require('nanoid');
const { songModel } = require('../../utils/SongModel');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = 'album-' + nanoid(16);
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3 ) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add album');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT a.id as "albumId", a.name as "albumName", a.year as "albumYear" ,s.id as id, s.title as title, s.year as year, s.performer as performer, s.genre as genre, s.duration as duration  FROM albums as a LEFT JOIN songs as s ON s."albumId" = a.id WHERE a.id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album not found');
    }

    const songs = result.rows.map(songModel);
    const album = result.rows.map(albumModel)[0];
    return {
      ...album,
      songs: !songs[0].id ? [] : songs,
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2,  "updatedAt" = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to update album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Failed to delete album. Id not found');
    }
  }
}

module.exports = AlbumsService;
