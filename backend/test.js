let lp = require("./util.js")

async function setup(){
  let u = await lp.get(32); 
  let s = await lp.get(22); 
  let s2 = await lp.get(31); 
  let read_zh_CN = await lp.get(43); 
  let read_en = await lp.get(44); 
  let read_ru = await lp.get(45); 

  await u.clearAttempts(); 
  await u.beginAttempting(s,  [read_zh_CN,read_en,read_ru])
  await u.beginAttempting(s2, [read_zh_CN,read_en,read_ru])
}

module.exports = {
  setup
}
