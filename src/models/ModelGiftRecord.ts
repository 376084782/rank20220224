import { Schema, model } from 'mongoose';

const ModelGiftRecord = new Schema({
  uid: { type: String, default: '' },
  giftId: { type: String, default: '' },
  giftName: { type: String, default: '' },
  createTime: { type: String, default: '' },
})

export default model('giftRecord', ModelGiftRecord);