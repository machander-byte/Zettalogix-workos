import mongoose from 'mongoose';

export const isValidObjectId = (value) =>
  Boolean(value) && mongoose.Types.ObjectId.isValid(value);

export const respondIfInvalidObjectId = (res, value, label = 'id') => {
  if (isValidObjectId(value)) return false;
  res.status(400).json({ message: `Invalid ${label}` });
  return true;
};

export default isValidObjectId;
