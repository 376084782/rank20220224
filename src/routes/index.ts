import API from "../api/API";
import ModelRank from "../models/ModelRank";
import ModelRankRecord from "../models/ModelRankRecord";

var express = require("express");
var router = express.Router();
/* GET home page. */
// 排行榜记录的最大条数
const countMax = 3;

router.get("/rank/count", async (req, res, next) => {
  let data = req.query;
  let record = await ModelRankRecord.findOne({
    uid: data.uid
  }) || {}
  res.send({
    code: 0, data: { count: record.count }
  });
})
router.get("/rank/info", async (req, res, next) => {
  let data = req.query;
  let list: any = await ModelRank.find().sort({ score: -1, time_update: 1 }).limit(100);
  let rankIdx = 0;
  for (let i = 0; i < list.length; i++) {
    let e = list[i]
    if (e.uid == data.uid) {
      rankIdx = i + 1;
      break
    }
  }
  res.send({
    code: 0, data: { rankIdx }
  });
})

router.get("/rank/update", async (req, res, next) => {
  let data = req.query;
  let record = await ModelRankRecord.findOne({
    uid: data.uid
  })
  if (!record) {
    await ModelRankRecord.create({
      time_update: getTimeNow(),
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      count: 1
    })
  } else {
    // if (record.count >= 3) {
    //   res.send({
    //     code: 20001, data: {}, msg: '上报超过三次'
    //   });
    //   return
    // }
    await ModelRankRecord.updateOne({
      uid: data.uid
    }, {
      count: record.count + 1
    })
  }
  let dataUser = await ModelRank.findOne({ uid: data.uid });
  let count = await ModelRank.find().count();
  if (!!dataUser) {
    // 存在已有数据，对比自己的分数是不是刷新记录了，更新数据
    await ModelRank.updateOne({ uid: data.uid }, { score: data.score })
  } else if (count < countMax) {
    // 当前排行榜记录数不足最大记录条数
    // 记录之
    await ModelRank.create({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      score: data.score,
      time_update: getTimeNow(),
    })
  } else {
    // 自己没有上过榜
    // 获取榜单上的最低分
    let dataMin: any = await ModelRank.find().sort({ score: 1, time_update: -1 }).limit(1).findOne()
    if (dataMin.score < data.score) {
      // 榜上的最低分比新数据底，替换之
      await ModelRank.updateOne({
        uid: dataMin.uid
      }, {
        uid: data.uid,
        nickname: data.nickname,
        avatar: data.avatar,
        score: data.score,
        time_update: getTimeNow(),
      })
    }
  }

  res.send({
    code: 0, data: {}
  });
});

function getTimeNow() {
  let time = new Date();
  time.setHours(0);
  time.setMinutes(0);
  time.setSeconds(0);
  time.setMilliseconds(0)
  return time.getTime();
}

module.exports = router;
