import excelPort, { WorkSheet } from 'node-xlsx';
import API from "../api/API";
import ModelGift from "../models/ModelGift";
import ModelUser from "../models/ModelUser";
import ModelRank from "../models/ModelRank";
import ModelRankRecord from "../models/ModelRankRecord";
import Util from "../socket/Util";
const axios = require("axios");
const Qs = require("qs");
var express = require("express");
var router = express.Router();
/* GET home page. */
// 排行榜记录的最大条数
const countMax = 500;
// const host = 'https://scrm-uat.sleemon.cn/sleemon/apiserver';
// const clientId = '9d54cc949f4b49858d1a59e81d665cb9'
// const clientSecret = '9cc08aba966d490ba2d7139fc3876812cb3becb0158a4c9684aa7d0b6680a324'


const host = 'https://scrm.sleemon.cn/sleemon/apiserver';
const clientId = 'b081ed03d2d64f4d84cc5168ee7a2cbc'
const clientSecret = '02394452d4ba4520ae4134a8debe3d40adc7dae7f57a4767ac576cf6180e9c47'

const timeEnd = new Date('2022/3/29 0:0:0:0')
let dataToken: any = {}

let secLast = 0;
const tempMap = [23000085, 23000086, 23000087, 23000090, 23000090]

function checkToken() {
  return new Promise((rsv) => {
    let secNow = Math.floor(new Date().getTime() / 1000);
    let timeOff = secNow - secLast;
    if (dataToken && dataToken.expires_in && timeOff < dataToken.expires_in) {
      rsv(dataToken)
    } else {
      axios({
        method: 'get',
        url: host + `/oauth/token`,
        params: {
          grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret
        }
      }).then(async e => {
        dataToken = e.data
        secLast = secNow
        rsv(dataToken)
      })
    }
  })
}
checkToken()

function getUserInfo(data) {
  return new Promise(async (rsv, rej) => {
    await checkToken()
    axios({
      url: host + '/coupon/coupons/couponReceiveToMember',
      method: 'post',
      data: {
        // userId
        id: data.uid
      },
      headers: {
        "Content-Type": "application/json",
        'Authorization': 'Bearer ' + dataToken.access_token
      }
    }).then(e => {
      rsv(e)
    }).catch(e => {
      rej(e)
    })
  })
}


function writeExcel(datas, map) {

  let sheetData = [];
  // 写入表头
  let colTitle = [];
  for (let key in map) {
    colTitle.push(map[key])
  }
  sheetData.push(colTitle)
  datas.forEach(element => {
    let colData = [];
    for (let key in map) {
      colData.push(element[key])
    }
    sheetData.push(colData)
  });

  let xlsxObj = [{
    name: 'sheet1',
    data: sheetData,
    options: {}
  }]
  //生成表格
  let file = excelPort.build(xlsxObj);
  return file;
}

router.get("/excel", async (req, res, next) => {
  // 不存在奖励的 抽个奖
  let list = await ModelUser.find({});
  let file = writeExcel(list, {
    uid: 'id',
    nickname: '姓名',
    sex: '性别',
    phone: '手机号',
    giftId: '获得优惠券id',
    isGot: '是否领取优惠券',
    score: '最高得分',
  })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader("Content-Disposition", "attachment; filename=" + "list.xlsx");
  res.send(file);
})


router.get("/v2/login", async (req, res, next) => {
  let data = req.query || {}
  let { uid, nickname, avatar, phone } = data;
  let record = await ModelUser.findOne({ uid: data.uid });
  if (!record) {
    await ModelUser.create({
      uid, nickname, avatar, phone, isGot: false, score: 0
    })
  }
  res.send({
    code: 0,
    data: {
      state: true
    }
  })
})
function doRandomByPower(list) {
  let powerAll = list.reduce(function (prev, cur) {
    return prev + cur.power;
  }, 0);
  let idx = Math.floor(Math.random() * (powerAll - 0) + 0);
  let sumCur = 0
  console.log(powerAll, 'powerAll', idx, list)
  for (let i = 0; i < list.length; i++) {
    sumCur += list[i].power;
    console.log(sumCur, i, 'powerAll')
    if (idx < sumCur) {
      return list[i]
    }
  }
}

router.get("/v2/random", async (req, res, next) => {
  // 不存在奖励的 抽个奖
  let giftList = await ModelGift.find();
  let giftListHave = giftList.filter(e => e.count > 0 || e.id == -1);
  let gift = doRandomByPower(giftListHave);
  res.send({
    code: 0,
    data: gift
  })
})

router.get("/v2/score", async (req, res, next) => {
  let data = req.query || {}
  let { uid, score } = data;
  let record = await ModelUser.findOne({ uid: uid });
  if (!record) {
    res.send({
      code: 0,
      data: {
        state: false
      }
    })
  } else {
    await ModelUser.updateOne({ uid }, { score });
    if (!record.giftId || record.giftId == -1) {
      if (score >= 10) {
        // 不存在奖励的 抽个奖
        let giftList = await ModelGift.find();
        let giftListHave = giftList.filter(e => e.count > 0 || e.id == -1);
        let gift = doRandomByPower(giftListHave);
        await ModelGift.updateOne({ id: gift.id }, { count: gift.count - 1 })
        await ModelUser.updateOne({ uid }, { giftId: gift.id });
      }
    }
    res.send({
      code: 0,
      data: {
        state: true
      }
    })
  }
})

router.get("/v2/award", async (req, res, next) => {
  let data = req.query || {}
  let { uid } = data;
  let record = await ModelUser.findOne({ uid: uid });
  if (!record) {
    res.send({
      code: 0,
      data: {
        state: 0,
      }
    })
  } else {
    if (record.giftId != -1) {
      // 存在奖励
      let gift = await ModelGift.findOne({ id: record.giftId })
      if (record.isGot) {
        res.send({
          code: 0,
          data: {
            state: 2,
            awardData: {
              name: gift.name
            }
          }
        })
      } else {
        res.send({
          code: 0,
          data: {
            state: 1,
            awardData: {
              name: gift.name
            }
          }
        })
      }
    } else {
      res.send({
        code: 0,
        data: {
          state: 0,
        }
      })

    }
  }
})

router.get("/v2/get", async (req, res, next) => {
  let data = req.query || {}
  let { uid } = data;
  let record = await ModelUser.findOne({ uid: data.uid });
  if (record && record.giftId != -1 && !record.isGot) {
    await checkToken();
    doSendTicket({ uid: uid, phone: record.phone }, record.giftId).then(async e => {
      await ModelUser.updateOne({ uid }, { isGot: true })
      res.send({
        code: 0,
        data: {
          state: true,
          describe: '奖励已发放'
        }
      })
    }).catch(e => {
      res.send({
        code: 0,
        data: {
          state: false,
          describe: '奖励发放失败'
        }
      })
    })
  } else {
    res.send({
      code: 0,
      data: {
        state: false,
        describe: '无待发放奖励'
      }
    })
  }
})





router.get("/user/info", async (req, res, next) => {
  let data = req.query;
  getUserInfo(data).then(e => {
    res.send(e)
  }).catch(e => {
    // todo:token过期 再来一遍
    getUserInfo(data).then(e1 => {
      res.send(e1)
    }).catch(e1 => {
      res.send(e1)
    })

  })

})
router.get("/award/get", async (req, res, next) => {
  // 传参 uid phone
  let data = req.query;
  let record = await ModelUser.findOne({ uid: data.uid });
  if (!record) {
    res.send({
      code: 10011,
      msg: '您没有获得奖励，无法领取',
      data: {}
    })
    return
  }
  await checkToken();
  doSendTicket({ uid: data.uid, phone: data.phone }, record.giftId)
    .then(() => {
      res.send({
        code: 0,
        msg: '发放优惠券成功',
        data: {}
      })
    })
    .catch(e => {
      res.send({
        code: 10012,
        msg: '发放失败，请联系客服处理',
        data: e
      })
    })
})
router.get("/award/random", async (req, res, next) => {
  // 传参 uid 
  let data = req.query;
  // 判断这个人领取过奖励了没有
  let record = await ModelUser.findOne({ uid: data.uid });
  if (record) {
    res.send({
      code: 0,
      data: {
        uid: record.uid, //用户uid
        giftId: record.giftId, //奖励id
        giftName: record.giftName,//奖励名称
        isGot: record.isGot //是否已领取
      }
    })
    return
  } else {
    if (!!data.score) {
      res.send({
        code: 0,
        msg: '很遗憾，没有中奖',
        data: {
          giftId: -1,
        }
      })
      return
    }
  }
  let p = Math.random() < .8
  if (p) {
    let giftList = await ModelGift.find();
    let giftListHave = giftList.filter(e => e.count > 0);
    if (giftListHave.length == 0) {
      // 奖池发完的情况，返回没中奖
      res.send({
        code: 0,
        msg: '很遗憾，没有中奖',
        data: {
          giftId: -1,
        }
      })
      return
    }
    let gift = giftListHave[Util.getRandomInt(0, giftListHave.length)];
    let dataRecordNew = {
      uid: data.uid,
      giftId: gift.id,
      giftName: gift.name,
      createTime: new Date().toLocaleString(),
      isGot: false
    };
    await ModelGift.updateOne({ id: gift.id }, { count: gift.count - 1 })
    await ModelUser.create(dataRecordNew)
    res.send({
      code: 0,
      msg: `恭喜获得${gift.name}`,
      data: dataRecordNew
    })
  } else {
    res.send({
      code: 0,
      msg: '很遗憾，没有中奖',
      data: {
        giftId: -1,
      }
    })
  }
})

router.get("/award/send", async (req, res, next) => {
  let data = req.query;
  await checkToken();
  // 做一个循环 在榜上的发放优惠券
  try {
    let list: any = await ModelRank.find().sort({ score: -1, time_update: 1 }).limit(100);
    console.log('排行榜待发放列表', list)
    for (let i = 0; i < list.length; i++) {
      let info = list[i];
      if (!info.flagSend) {
        let tempId = 0;
        if (i < 3) {
          tempId = tempMap[0]
        } else if (i < 10) {
          tempId = tempMap[1]
        } else if (i < 30) {
          tempId = tempMap[2]
        } else if (i < 100) {
          tempId = tempMap[3]
        } else if (i < 500) {
          tempId = tempMap[4]
        }
        console.log('发放', info, tempId)
        await doSendTicket(info, tempId);
        await ModelRank.updateOne({ uid: info.uid }, { flagSend: true })
      }
    }
    res.send({
      code: 0
    })
  } catch (e) {
    console.log('发放优惠券有问题了')
    res.send({
      code: -1
    })
  }
})

function doSendTicket(user, tempId) {
  return new Promise((rsv, rej) => {
    axios({
      url: host + '/coupon/coupons/couponReceiveToMember',
      method: 'post',
      data: {
        // 优惠券id
        couponTemplateId: tempId,
        // userId
        id: user.uid
      },
      headers: {
        "Content-Type": "application/json",
        'Authorization': 'Bearer ' + dataToken.access_token
      }
    }).then(e => {
      if (e.data.ok) {
        console.log(`用户${user.uid}（${user.phone}）发放优惠券结果:`, e.data)
        rsv(e.data)
      } else {
        console.log(`用户${user.uid}（${user.phone}）发放优惠券失败结果:`, e.data)
        rej(e.data)
      }
    }).catch(e => {
      console.log(`用户${user.uid}（${user.phone}）发放优惠券失败:`, user, e.response)
      rej(e.response)
    })
  })
}

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
  let dataSelf: any = {};
  for (let i = 0; i < list.length; i++) {
    let e = list[i]
    if (e.uid == data.uid) {
      rankIdx = i + 1;
      dataSelf = e
      break
    }
  }
  res.send({
    code: 0, data: { rankIdx, score: dataSelf.score }
  });
})

router.get("/rank/update", async (req, res, next) => {
  let data = req.query;
  if (new Date().getTime() > timeEnd.getTime()) {
    res.send({
      code: 20002, data: {}, msg: '超出活动时间'
    });
    return
  }
  let dataUser = await ModelRank.findOne({ uid: data.uid });
  let count = await ModelRank.find().count();
  if (!!dataUser) {
    // 存在已有数据，对比自己的分数是不是刷新记录了，更新数据
    await ModelRank.updateOne({ uid: data.uid }, {
      score: data.score,
      nickname: data.nickname,
      avatar: data.avatar,
      phone: data.phone
    })
  } else if (count < countMax) {
    // 当前排行榜记录数不足最大记录条数
    // 记录之
    await ModelRank.create({
      uid: data.uid,
      nickname: data.nickname,
      avatar: data.avatar,
      score: data.score,
      time_update: getTimeNow(),
      phone: data.phone
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
        phone: data.phone
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
