const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const { songModel } = require('../../utils/SongModel');
const { activityModel } = require('../../utils/ActivityModel');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist failed to add');
    }

    return result.rows[0].id;
  }

  async getPlaylistById(id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist not found');
    }
    return result.rows[0];
  }

  async getPlaylists(id) {
    const query = {
      text: 'SELECT p.id as id, p.name as name, u.username as username FROM playlists as p LEFT JOIN users as u ON p.owner = u.id LEFT JOIN collaborations as c ON p.id = c.playlist_id WHERE p.owner = $1 OR c.user_id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete playlist. Id not found');
    }
  }

  async addPlaylistSong(playlistId, songId) {
    const id = `playlist-songs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to add to playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSongs(id) {
    const query = {
      text: 'SELECT p.id as "playlistId", p.name as "playlistName", u.username as username, s.id as id, s.title as title, s.performer as performer FROM playlists as p JOIN users as u ON p.owner = u.id JOIN playlist_songs ps ON p.id = ps.playlist_id JOIN songs as s ON s.id = ps.song_id WHERE p.id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist not found');
    }

    const songs = result.rows.map(songModel);
    const playlist = {
      id: result.rows[0].playlistId,
      name: result.rows[0].playlistName,
      username: result.rows[0].username,
    };
    return {
      ...playlist,
      songs,
    };
  }

  async deletePlaylistSong(id, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [id, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Song failed to delete from playlist.');
    }
  }

  async addPlaylistSongActivity(playlistId, songId, userId, action) {
    const id = `playlist-songs-activity${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, songId, userId, action],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to add to playlist activity');
    }

    return result.rows[0].id;
  }

  async getPlaylistSongActivities(id) {
    const query = {
      text: `SELECT p.id as "playlistId", u.username as username, s.title as title, psa.action as action, psa.time as time 
      FROM playlists as p 
      JOIN users as u ON p.owner = u.id 
      LEFT JOIN playlist_song_activities as psa ON p.id = psa.playlist_id
      JOIN songs as s ON s.id = psa.song_id 
      WHERE p.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist not found');
    }
    const activities = result.rows.map(activityModel);
    return {
      playlistId: result.rows[0].playlistId,
      activities,
    };
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist not found');
    }
    const plalist = result.rows[0];
    if (plalist.owner !== owner) {
      throw new AuthorizationError('You are not authorized to access this resource');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
