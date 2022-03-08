
import ModelGift from "../models/ModelGift";
import ModelUser from "../models/ModelUser";
async function initGift() {
  const listGift = [
    // 测试环境的券
    // { name: '5000元现金抵用券', id: '23000085', count: 1, power: 3 },
    // { name: '3000元现金抵用券', id: '23000086', count: 1, power: 7 },
    // { name: '1000元现金抵用券', id: '23000087', count: 1, power: 10 },
    // { name: '乳胶枕抵用券', id: '23000090', count: 100, power: 100 },
    // { name: '口罩抵用券', id: '23000090', count: 1800, power: 300 },
    // { name: '蒸汽眼罩抵用券', id: '23000090', count: 1000, power: 200 },
    // { name: '谢谢惠顾', id: '-1', count: 10, power: 380 },

    // 正式环境的券
    { name: '5000元现金抵用券', id: '23000014', count: 1, power: 3 },
    { name: '3000元现金抵用券', id: '23000015', count: 1, power: 7 },
    { name: '1000元现金抵用券', id: '23000016', count: 1, power: 10 },
    { name: '乳胶枕抵用券', id: '23000018', count: 100, power: 100 },
    { name: '口罩抵用券', id: '23000020', count: 1800, power: 300 },
    { name: '蒸汽眼罩抵用券', id: '23000019', count: 1000, power: 200 },
    { name: '谢谢惠顾', id: '-1', count: 10, power: 380 },

  ];
  await ModelGift.deleteMany();
  ModelGift.create(listGift)
}
async function initUser() {
  await ModelUser.deleteMany();
}

async function fixGiftCount() {
  let listUsers = await ModelUser.find();
  listUsers.forEach(async user => {
    if (user.giftId > -1) {
      let gift: any = await ModelGift.find({ id: user.giftId });
      await ModelGift.updateOne({ id: gift.id }, { count: gift.count - 1 });
      console.log('修正礼物库存', gift.name, gift.count - 1)
    }
  })
}

const createData = async () => {
  // await initGift()
  // await initUser()
  await fixGiftCount()
}
export { createData }