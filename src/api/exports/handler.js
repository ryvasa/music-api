class ExportsHandler {
  constructor(playlistsService, producerService, validator) {
    this._playlistsService = playlistsService;
    this._producerService = producerService;
    this._validator = validator;
  }

  async postExportPlaylistsHandler(request, h) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistsService.getPlaylistById(playlistId);
    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);
    this._validator.validateExportPlaylistsPayload(request.payload);

    const message = {
      userId,
      targetEmail: request.payload.targetEmail,
      playlistId,
    };

    await this._producerService.sendMessage('export:playlists', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Your request is in the queue',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
