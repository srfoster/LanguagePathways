let lp = require("./util.js")

async function canStartAttempting(){
  let u = await lp.get(32); 
  let s = await lp.get(22); 
  let read_zh_CN = await lp.get(43); 
  let read_en = await lp.get(44); 
  let read_ru = await lp.get(45); 

  await u.clearAttempts(); 
  let a = await u.beginAttempting(s, [read_zh_CN,read_en,read_ru])

  a = await a.pass()
  a = await a.pass()
  a = await a.fail()

  console.log(a.isDue())
  return a
}

module.exports = {
  canStartAttempting
}
