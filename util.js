
//TODO: TTS audio solution (Chinese and russian)
//TODO: js indentation plugin
//TODO: Add more sentences.  Start building UI (other package?)

let env = require("./env.js")

async function runQuery(s, d){
 const neo4j = require('neo4j-driver')

const driver = neo4j.driver(env.uri, neo4j.auth.basic(env.uname, env.pword))
const session = driver.session()
const sentenceData = s

try {
  const result = await session.run( s, d )

  const singleRecord = result.records[0]
  const node = singleRecord.get(0)

  console.log(node.properties.name)
} finally {
  await session.close()
}

// on application exit:
await driver.close()
}

async function translation(s,lang){
  let translate = require('@vitalets/google-translate-api');
 
  return (await translate(s, {to: lang})).text
}

function addSentence(s){
  return runQuery(
    'MERGE (s:Sentence {data: $sentenceData}) RETURN s',
    { sentenceData: s })
}

function addWord(w){
  return runQuery(
    'MERGE (w:Word {data: $wordData}) RETURN w',
    { wordData: w })
}

function linkSentences(s1,s2){
  return runQuery(
    'MATCH (s1:Sentence),(s2:Sentence) WHERE s1.data = $s1Data and s2.data = $s2Data MERGE (s1)-[:GT]->(s2) return s1,s2',
    { s1Data: s1, s2Data: s2 }) }

function linkWordAndSentence(w,s){
  return runQuery(
    'MATCH (w:Word),(s:Sentence) WHERE w.data = $wData and s.data = $sData MERGE (w)-[:In]->(s) return w,s',
    { wData: w, sData: s}) }

async function extendTo(s,lang){
  await addSentence(s)
  var to = await translation(s, lang)
  await addSentence(to)
  await linkSentences(s,to)
}

async function extendZhCn(s){
  await extendTo(s, "zh-CN")
}

async function extendEn(s){
  await extendTo(s, "en")
}

async function extendRu(s){
  await extendTo(s, "ru")
}

function sayEn(s){
  let open = require('open')
  return open(`https://translate.google.com/translate_tts?tl=${'en'}&q=${encodeURIComponent(s)}&client=en`)
}

function sayZh(s){
 //TODO: Broken, uninstall yanyu.  Find better zh tts solution 
 /*
  let open = require('open')
  let Yan = require('yanyu').default
  let yan = new Yan()
  return yan.synthesis(s, 'pinyin-syllables')
 */
}

module.exports = {
  addSentence,
  addWord,
  linkSentences,
  linkWordAndSentence,
  translation,
  extendZhCn,
  extendEn,
  extendRu,
  sayEn,
  sayZh,
}


