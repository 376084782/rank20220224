
import ModelGift from "../models/ModelGift";
async function initGift() {
  const listGift = [
    { name: '奖励1', id: 23000085, count: 10 },
    { name: '奖励2', id: 23000086, count: 10 },
    { name: '奖励3', id: 23000087, count: 10 },
    { name: '奖励4', id: 23000090, count: 10 },
    { name: '奖励5', id: 23000090, count: 10 },
  ];
  await ModelGift.deleteMany();
  ModelGift.create(listGift)
}

const createData = async () => {
  await initGift()
}
export { createData }