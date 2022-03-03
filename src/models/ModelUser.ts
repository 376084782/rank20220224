import { Schema, model } from 'mongoose';

const ModelUser = new Schema({
  uid: { type: String, default: '' },
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  giftId: { type: String, default: '-1' },
  isGot: { type: Boolean, default: false },
  score: { type: Number, default: 0 }
})

export default model('user', ModelUser);