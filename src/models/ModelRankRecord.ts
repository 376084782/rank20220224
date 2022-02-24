
import { Schema, model } from 'mongoose';
const ModelRankRecord = new Schema({
  // 上报时间
  time_update: { type: Number, default: 0 },
  // uid
  uid: { type: String, default: '' },
  // 玩家名称
  nickname: { type: String, default: '' },
  // 玩家头像
  avatar: { type: String, default: '' },
  // 上报次数
  count: { type: Number, default: 0 },
})

export default model('rankRecord', ModelRankRecord);