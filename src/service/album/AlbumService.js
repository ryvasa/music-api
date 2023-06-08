const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const { albumModel } = require('../../utils/AlbumModel');
const NotFoundError = require('../../exceptions/NotFoundError');
const { nanoid } = require('nanoid');

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
      text: 'SELECT * FROM albums  WHERE id = $1',
      values: [id],
    };
    const querysong = {
      text: 'SELECT * FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    const songs = await this._pool.query(querysong);

    if (!result.rows.length) {
      throw new NotFoundError('Album not found');
    }
    return {
      ...result.rows.map(albumModel)[0],
      songs: songs.rows,
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
