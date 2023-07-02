const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { albumModel } = require('../../utils/AlbumModel');
const NotFoundError = require('../../exceptions/NotFoundError');
const { songModel } = require('../../utils/SongModel');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
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
      text: 'SELECT a.id as "albumId", a.name as "albumName", a.year as "albumYear", a.cover as cover, s.id as id, s.title as title, s.year as year, s.performer as performer, s.genre as genre, s.duration as duration  FROM albums as a LEFT JOIN songs as s ON s."albumId" = a.id WHERE a.id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
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

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update album. Id not found');
    }
  }

  async addCover(id, cover) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET cover = $1, "updatedAt" = $2 WHERE id = $3 RETURNING id',
      values: [cover, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete album. Id not found');
    }
  }

  async getAlbumLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      throw new InvariantError('Failed to like the album');
    }
  }

  async addAlbumLike(albumId, userId) {
    await this._cacheService.delete(`album:${albumId}`);
    await this.getAlbumLike(albumId, userId);

    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to like the album');
    }

    return result.rows[0].id;
  }

  async deleteAlbumLike(albumId, userId) {
    await this._cacheService.delete(`album:${albumId}`);

    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to remove like the album');
    }
  }

  async getAlbumLikes(id) {
    try {
      const cache = await this._cacheService.get(`album:${id}`);
      return { value: JSON.parse(cache), cache: true };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1 ',
        values: [id],
      };

      const result = await this._pool.query(query);

      if (!result.rows[0].id) {
        throw new InvariantError('Failed to get album like');
      }

      await this._cacheService.set(`album:${id}`, JSON.stringify(result.rowCount));

      return { value: result.rowCount, cache: false };
    }
  }
}

module.exports = AlbumsService;
