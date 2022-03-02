import { Schema, model } from 'mongoose';

const ModelGift = new Schema({
  name: { type: String, default: '' },
  id: { type: String, default: '' },
  count: { type: Number, default: 0 },
})

export default model('gift', ModelGift);