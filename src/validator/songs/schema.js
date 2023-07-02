/* eslint-disable newline-per-chained-call */
const Joi = require('joi');

const currentYear = new Date().getFullYear();

const SongPayloadSchema = Joi.object({
  title: Joi.string().max(1000).required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
  genre: Joi.string().max(1000).required(),
  performer: Joi.string().max(1000).required(),
  duration: Joi.number(),
  albumId: Joi.string().max(1000),
});

module.exports = { SongPayloadSchema };
