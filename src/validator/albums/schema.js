/* eslint-disable newline-per-chained-call */
const Joi = require('joi');

const currentYear = new Date().getFullYear();

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().max(1000).required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
});

const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string()
    .valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp')
    .required(),
}).unknown();

module.exports = { AlbumPayloadSchema, ImageHeadersSchema };
