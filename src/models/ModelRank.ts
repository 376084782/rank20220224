import { Schema, model } from 'mongoose';

const ModelRank = new Schema({
  // 上报时间
  time_update: { type: Number, default: 0 },
  // 分数
  score: { type: Number, default: 0 },
  // uid
  uid: { type: String, default: '' },
  // 玩家名称
  nickname: { type: String, default: '' },
  // 玩家头像
  avatar: { type: String, default: '' },
})

export default model('rank', ModelRank);