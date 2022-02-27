let debug = true

//TODO: Redo attempt functions as User-[:Attempt]-Sentence, with intervals and due dates.  
//  * Make one :AttemptType, cypher query that generates data for the back of a card...
//  * Attempt all existing sentences
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

if(debug) console.log(s)

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

class Edge{
  constructor(id,properties){
    this.id=id
    Object.keys(properties).map((k)=>this[k]=properties[k])
  }
}

class Node{
  constructor(id,properties){
    this.id=id
    Object.keys(properties).map((k)=>this[k]=properties[k])
  }
}

class Attempt extends Edge{
  async pass(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a += {status: \"PASSED\", modified_at: localdatetime(), times_right: a.times_right+1, duration: a.duration*2} RETURN a", {id: this.id})
  }

  async fail(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a += {status: \"FAILED\", modified_at: localdatetime(), times_wrong: a.times_wrong+1, duration: a.duration/2} RETURN a", {id: this.id})
  }

  async reset(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a = {status: \"NONE\", created_at: localdatetime(), modified_at: localdatetime(), times_wrong: 0, times_right: 0, duration: 10} RETURN a", {id: this.id})
  }

async flashCard(side){

   let s = await resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN s', { attempt_id: this.id })
   let a = await resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN a', { attempt_id: this.id })
   let ats = await a.getAttemptTypes()

   let target_sentences = await Promise.all(ats.map(async (at)=>{
     return await at.getAnswerFor(s)
   }))
   
   console.log(s.data)
   for(let at of ats){
     let target_s = await at.getAnswerFor(s)
     if(target_s){
       if(side == "front")
         console.log(at.type, at.params, "______")
       if(side == "back")
         console.log(at.type, at.params, target_s.data)
     }
   }
}

  async getAttemptTypes(){
    let atis = JSON.parse(this.attempt_type_ids)

    let ret = []
 
    for(let i=0;i<atis.length;i++){
      ret.push(await resolve1("MATCH(x) WHERE id(x) = $id RETURN x",{id:atis[i]}))
    }

    return ret
  }
}

class AttemptType extends Node{
  async getAnswerFor(sentence){
    if(this.cached_answer) return this.cached_answer
    this.cached_answer = await resolve1(this.cypher, {...JSON.parse(this.params), id: sentence.id})

    return this.cached_answer
  }
}

class Sentence extends Node{}
class Word extends Node{}

async function resolve1(s,d){
  let x = await runQuery(s,d)

  if(!x.records[0]) return null

  let data = x.records[0].get(0)

  let Type  

  if(data.type == "Attempt")  Type = Attempt
  if(data.labels && data.labels.indexOf("Sentence")>=0) Type = Sentence
  if(data.labels && data.labels.indexOf("Word")>=0) Type = Word
  if(data.labels && data.labels.indexOf("AttemptType")>=0) Type = AttemptType

  if(!Type) throw Error("Could not find constructor for: "+ JSON.stringify(data))

  return new Type(neo4j.int(data.identity).toNumber(), data.properties || {})
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

function addUser(username){
  return runQuery(
    'MERGE (u:User {username: $username}) RETURN u',
    { username: username}) 
}

function addAttemptType(type, cypher, params){
  return runQuery(
    'MERGE (at:AttemptType {type: $type, cypher: $cypher, params: $params}) RETURN at',
    {type: type, cypher: cypher, params: JSON.stringify(params)}) 
}

function addReadingAttemptType(lang){
  addAttemptType("Reading", "MATCH (s1:Sentence)-[t:To]->(s2:Sentence) WHERE t.through = \"gt\" AND t.output = $output AND id(s1) = $id RETURN s2", {output: lang})
}

function deleteNode(id){
  runQuery("MATCH (x) WHERE id(x) = $id DELETE x", {id})
}

function addAttempt(username,attempt_type_ids,s1){
  return runQuery(
    'MATCH (u:User),(s1:Sentence) WHERE u.username = $username AND s1.data = $s1Data MERGE (u)-[a:Attempt {attempt_type_ids: $attempt_type_ids, created_at: localdatetime(), modified_at: localdatetime(), duration: 10, times_right: 0, times_wrong: 0, status: "NONE"}]->(s1) RETURN a',
    { username: username, s1Data: s1, attempt_type_ids: JSON.stringify(attempt_type_ids)}) 
}


async function getAttempt(attempt_id){
   return await resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN a', { attempt_id })
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
  addAttemptType,
  addReadingAttemptType,
  addAttempt,
  getAttempt,
  userAttempts,
  unattemptedSentences,
  randomUnattemptedSentence,


  //Low level
  deleteNode,
  runQuery, resolve1
}


