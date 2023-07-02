class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._validator = validator;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const albumId = await this._albumsService.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album added successfully',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album updated successfully',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album deleted successfully',
    };
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const coverUrl = await this._storageService.writeFile(cover, cover.hapi);

    await this._albumsService.addCover(
      request.params.id,
      `http://${process.env.HOST}:${process.env.PORT}/albums/cover/${coverUrl}`,
    );

    const response = h.response({
      status: 'success',
      message: 'Cover uploaded successfully',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;

    await this._albumsService.getAlbumById(albumId);
    await this._albumsService.addAlbumLike(albumId, request.auth.credentials.id);

    const response = h.response({
      status: 'success',
      message: 'The album has been liked',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request, h) {
    await this._albumsService.deleteAlbumLike(request.params.id, request.auth.credentials.id);

    const response = h.response({
      status: 'success',
      message: 'Album cancel liked',
    });
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { value, cache } = await this._albumsService.getAlbumLikes(request.params.id);

    const response = h.response({
      status: 'success',
      data: {
        likes: value,
      },
    });
    if (cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = AlbumsHandler;
