class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;
  }

  async postPlaylistHandler(request, h) {
    const { id } = request.auth.credentials;

    this._validator.validatePostPlaylistPayload(request.payload);
    const playlistId = await this._playlistsService.addPlaylist({
      owner: id,
      ...request.payload,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist added successfully',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(id);
    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: owner } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(id, owner);
    await this._playlistsService.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist deleted successfully',
    };
  }

  async postPlaylistSongHandler(request, h) {
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id } = request.auth.credentials;

    this._validator.validatePostPlaylistSongPayload(request.payload);
    await this._playlistsService.verifyPlaylistAccess(playlistId, id);
    await this._songsService.getSongById(songId);
    await this._playlistsService.addPlaylistSong(playlistId, songId);
    await this._playlistsService.addPlaylistSongActivity(playlistId, songId, id, 'add');
    const response = h.response({
      status: 'success',
      message: 'Song added to playlist successfully',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongHandler(request, h) {
    const { id } = request.params;
    const { id: owner } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistAccess(id, owner);
    const { value, cache } = await this._playlistsService.getPlaylistSongs(id);

    const response = h.response({
      status: 'success',
      data: {
        playlist: value,
      },
    });
    if (cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deletePlaylistSongByIdHandler(request, h) {
    const { id } = request.params;
    const { id: owner } = request.auth.credentials;
    const { songId } = request.payload;

    await this._playlistsService.verifyPlaylistAccess(id, owner);
    await this._playlistsService.deletePlaylistSong(id, songId);
    await this._playlistsService.addPlaylistSongActivity(id, songId, owner, 'delete');

    const response = h.response({
      status: 'success',
      message: 'Song deleted from playlist',
    });
    response.code(200);
    return response;
  }

  async getPlaylistSongActivitiesHandler(request, h) {
    const { id } = request.params;
    const { id: owner } = request.auth.credentials;
    await this._playlistsService.getPlaylistById(id);
    await this._playlistsService.verifyPlaylistAccess(id, owner);
    const playlist = await this._playlistsService.getPlaylistSongActivities(id);

    const response = h.response({
      status: 'success',
      data: playlist,
    });
    response.code(200);
    return response;
  }
}

module.exports = PlaylistsHandler;
