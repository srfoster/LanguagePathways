
//TODO: TTS audio solution (Chinese and russian)
//TODO: js indentation plugin
//TODO: Add more sentences.  Taxonomy.  
//TODO: Start building UI (other package?)
//TODO: Design the SRS features.  Attempts join sentences and point to user
//        Attempts need dates?  
//TODO: user/ownership/multiplayer/gamification/social features

let env = require("./env.js")

const neo4j = require('neo4j-driver')
const driver = neo4j.driver(env.uri, neo4j.auth.basic(env.uname, env.pword))
//Should call...
//await driver.close()

async function runQuery(s, d){

const session = driver.session()
const sentenceData = s

try {
  const result = await session.run( s, d )

//  const singleRecord = result.records[0]
//  const node = singleRecord.get(0)
//  return node

  return result
} finally {
  await session.close()
}

// on application exit:
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

//TODO:   addUser(u), attempt(u, s1, s2)

function addUser(username){
  return runQuery(
    'MERGE (u:User {username: $username}) RETURN u',
    { username: username}) 
}

function attempt(username,type,s1,s2){
  return runQuery(
    'MATCH (u:User),(s1:Sentence),(s2:Sentence) WHERE u.username = $username AND s1.data = $s1Data AND s2.data = $s2Data MERGE (s1)-[a:Attempt {type: $type, user: id(u)}]->(s2) RETURN a',
    { username: username, s1Data: s1, s2Data: s2, type: type}) 
}

function userAttempts(username, type){
  return runQuery(
    'MATCH (u:User),(s1)-[a:Attempt]->(s2) WHERE id(u) = a.user AND u.username = $username AND a.type = $type RETURN a',
    { username: username, type: type}) 
}

//TODO: Will get large, need to add LIMIT
function unattemptedSentences(username, type){
  return runQuery(
    'MATCH (u:User),(s1)-[a:Attempt]->(s2),(s3:Sentence) WHERE id(u) = a.user AND u.username = $username AND a.type = $type AND s3 <> s1 AND s3 <> s2 RETURN s3',
    { username: username, type: type}) 
}

async function randomUnattemptedSentence(username, type){
  //TODO: won't work after we add LIMIT 
  let ss = (await unattemptedSentences(username, type)).records


  return ss[Math.floor(Math.random()*ss.length)].get(0)
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
  addUser,
  attempt,
  userAttempts,
  unattemptedSentences,
  randomUnattemptedSentence,
}


