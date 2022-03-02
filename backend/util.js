let debug = false


let env = require("./env.js")

const dateFns = require('date-fns')
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




let cachedNow;
let clearCachedNow;

class Attempt extends Edge{
  toJson(){
    return {id: this.id, status: this.status, duration: this.duration.toNumber(), status_modified_at: this.status_modified_at.toString() }
  }
  
  async pass(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a += {status: \"PASSED\", modified_at: localdatetime(), status_modified_at: localdatetime(), times_right: a.times_right+1, duration: $newDuration} RETURN a", {id: this.id, newDuration: neo4j.int(this.nextDuration())})
  }

  nextDuration(){
    if(this.duration.toNumber() <= 10){ //10 minutes -> 20 minutes
      return 20
    }

    if(this.duration.toNumber() < 60*24){ //Less than 1 day, set to 1 day
      return 60*24
    }

    if(this.duration.toNumber() >= 60*24){ //Start doubling if duration is more than a day
      return this.duration.toNumber() * 2
    }
  }

  async fail(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a += {status: \"FAILED\", modified_at: localdatetime(), status_modified_at: localdatetime(), times_wrong: a.times_wrong+1, duration: 10} RETURN a", {id: this.id})
  }

  async reset(){
    return await resolve1("MATCH ()-[a:Attempt]->() WHERE id(a) = $id SET a += {status: \"NONE\", created_at: localdatetime(), modified_at: localdatetime(), status_modified_at: localdateTime(), times_wrong: 0, times_right: 0, duration: 10} RETURN a", {id: this.id})
  }

  async front(){
    return await this.flashCard("front")
  }

  async back(){
    return await this.flashCard("back")
  }

  getSentence(){
    return resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN s', { attempt_id: this.id })
  }

  async flashCard(side){
   let s = await resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN s', { attempt_id: this.id })
   let a = await resolve1( 'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(a) = $attempt_id RETURN a', { attempt_id: this.id })
   let ats = await a.getAttemptTypes()

   let target_sentences = await Promise.all(ats.map(async (at)=>{
     return await at.getAnswerFor(s)
   }))
   
   console.log(a.id + "   " + s.data)
   for(let at of ats){
     let target_s = await at.getAnswerFor(s)
     if(target_s){
       if(side == "front")
         console.log(at.type, at.params, "______")
       if(side == "back"){
         console.log(at.type, at.params, target_s.data)
       }
     }
   }

   if(side == "back") //Display metadata about the front of the card, if we are looking at back
     console.log(await s.describe())

}

  async getAttemptTypes(){
    let atis = JSON.parse(this.attempt_type_ids)

    let ret = []
 
    for(let i=0;i<atis.length;i++){
      ret.push(await resolve1("MATCH(x) WHERE id(x) = $id RETURN x",{id:atis[i]}))
    }

    return ret
  }

  dueDate(){
    return dateFns.addMinutes(dateFns.parseISO(this.status_modified_at.toString()), this.duration.toNumber())
  }

  //NOTE: This method is debounced, see global cachedNow...
  async now(){
    if(cachedNow){
      return cachedNow
    }

    if(clearCachedNow) clearTimeout(clearCachedNow)
    clearCachedNow = setTimeout(()=>{
      cachedNow = undefined
    },10000)

    let q = await runQuery("RETURN localdatetime()")

    cachedNow = dateFns.parseISO(q.records[0].get(0).toString())

    return cachedNow
  }

  async endOfSession(){
    return dateFns.addMinutes(await this.now(),10)
  }

  async isDue(){
    let due_date = this.dueDate()
    let due_date_passed = dateFns.isAfter(await this.endOfSession(),due_date)
    return this.status == "FAILED" || this.status == "NONE" || due_date_passed
  }
}

class AttemptType extends Node{
  async getAnswerFor(sentence){
    if(this.cached_answer) return this.cached_answer
    this.cached_answer = await resolve1(this.cypher, {...JSON.parse(this.params), id: sentence.id})

    return this.cached_answer
  }
}

class User extends Node{
  async getAttempts(){
    return await resolveMany(
      'match (u:User)-[a:Attempt]->(s:Sentence) where id(u) = $id return a',
      { id: this.id}) 
  }

  //TODO: This won't scale.  Do the logic in the db
  async getDueAttempts(){
    let as = await this.getAttempts()

    let ret = []

    for(let a of as){
      if(await a.isDue()) ret.push(a)
    }
 
    return ret
  }

  async getNextDueAttempt(){
    let as =  (await this.getDueAttempts())

    return as[Math.floor(Math.random()*as.length)] 
  }


  async clearAttempts(){
    await runQuery(
      'MATCH (u:User)-[a:Attempt]->(s:Sentence) WHERE id(u) = $id DELETE a',
      { id: this.id}) 
  }

  async beginAttempting(s, ats){
    let a = await resolve1(
      'MATCH (u:User),(s:Sentence) WHERE id(u) = $id AND id(s) = $sentence_id MERGE (u)-[a:Attempt {attempt_type_ids: $attempt_type_ids}]->(s) RETURN a',
      { id: this.id, sentence_id: s.id, attempt_type_ids: JSON.stringify(ats.map((a)=>a.id))}) 
    a = await a.reset()

    return a 
  }
}

class Sentence extends Node{
  async describe(){
    let en = await this.translation("en")
    let zh = await this.translation("zh-CN")
    let ru = await this.translation("ru")

    return({
      en: en.text,
      zh: `${zh.text} (${zh.pronunciation})`,
      ru: `${ru.text} (${ru.pronunciation})`,
    })
  }

  async translation(lang){
    return await translation(this.data, lang)
  }
}
class Word extends Node{}

async function resolveMany(s,d){
  let x = await runQuery(s,d)

  if(!x.records[0]) return []

  return x.records.map((r)=>wrap(r.get(0)))
}

async function resolve1(s,d){
  let x = await runQuery(s,d)

  if(!x.records[0]) return null

  let data = x.records[0].get(0)

  return wrap(data)
}

function wrap(data){
  let Type  

  if(data.type == "Attempt")  Type = Attempt
  if(data.labels && data.labels.indexOf("Sentence")>=0) Type = Sentence
  if(data.labels && data.labels.indexOf("Word")>=0) Type = Word
  if(data.labels && data.labels.indexOf("AttemptType")>=0) Type = AttemptType
  if(data.labels && data.labels.indexOf("User")>=0) Type = User

  if(!Type) throw Error("Could not find constructor for: "+ JSON.stringify(data))

  return new Type(neo4j.int(data.identity).toNumber(), data.properties || {})
}

async function translation(s,lang){
  let translate = require('@vitalets/google-translate-api');
 
  return (await translate(s, {to: lang}))
}

function addSentence(s){
  return resolve1(
    'MERGE (s:Sentence {data: $sentenceData}) RETURN s',
    { sentenceData: s })
}

//TODO: too specific to my 3 langs
async function addTriplet(s){
  let enS = await addSentence(s)
  let zhS = await extendZhCn(s) 
  let ruS = await extendRu(s) 

  extendEn(zhS.data) 
  extendRu(zhS.data) 

  extendEn(ruS.data) 
  extendZhCn(ruS.data) 

  return [enS,zhS,ruS] 
}

function addWord(w){
  return runQuery(
    'MERGE (w:Word {data: $wordData}) RETURN w',
    { wordData: w })
}

function linkSentences(s1,s2, lang){
  return runQuery(
    'MATCH (s1:Sentence),(s2:Sentence) WHERE s1.data = $s1Data and s2.data = $s2Data MERGE (s1)-[:To {through: \"gt\", output: $lang}]->(s2) return s1,s2',
    { s1Data: s1, s2Data: s2, lang }) }

function linkWordAndSentence(w,s){
  return runQuery(
    'MATCH (w:Word),(s:Sentence) WHERE w.data = $wData and s.data = $sData MERGE (w)-[:In]->(s) return w,s',
    { wData: w, sData: s}) }

async function extendTo(s,lang){
  await addSentence(s)
  var to = (await translation(s, lang)).text
  let s2 = await addSentence(to)
  await linkSentences(s,to, lang)

  return s2
}

async function extendZhCn(s){
  return await extendTo(s, "zh-CN")
}

async function extendEn(s){
  return await extendTo(s, "en")
}

async function extendRu(s){
  return await extendTo(s, "ru")
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

async function get(id){
  return await resolve1(
    'MATCH (x) WHERE id(x) = $id RETURN x',
    {id}) ||
    resolve1(
    'MATCH ()-[x]-() WHERE id(x) = $id RETURN x',
    {id}) 
}

async function setup(uid){
  let u = await get(uid); 

  let ss = await resolveMany("MATCH (s:Sentence),(u:User) WHERE NOT (u)-[:Attempt]->(s) AND id(u) = $uid RETURN s",{uid})

  //TODO: Gross hardcoded attempttype ids
  let read_zh_CN = await get(43); 
  let read_en = await get(44); 
  let read_ru = await get(45); 

  //await u.clearAttempts(); 

  for(let s of ss){
    console.log("Found new sentence.  Will begin attempting: " + s.data)
    await u.beginAttempting(s,  [read_zh_CN,read_en,read_ru])
  }
}

async function study(uid){
  await setup(uid) //Makes new :Attempts for any new sentences (without :Attempts)

  let u = await get(uid)
  let a = await u.getNextDueAttempt()

  const readline = require('readline/promises').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  while(a){
    let as = await u.getDueAttempts()

    console.log("\n\n\n\n\n\n*************")
    console.log(a)
    console.log("Cards remaining: " + as.length)
    await a.front()

    let  _ = await readline.question("Continue? ") 
    await a.back() 

    let resp = await readline.question("Pass or Fail? ")
    if(resp.startsWith("P")) {
      console.log("Nice! :)")
      a = await a.pass()
    } else if (resp.startsWith("F")) {
      console.log("Better luck next time :(")
      a = await a.fail()
    } 

    if(await a.isDue())
      console.log("This (" +a.id+ ") will be asked again in " + a.duration.toNumber() + " minutes")
    else
      console.log("You're done with this card for now")

    a = await u.getNextDueAttempt()
  }

  //readline.close()
  console.log("Session complete")
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
  unattemptedSentences,
  randomUnattemptedSentence,

  //A bit too specific.  Abstract these better.
  addTriplet,

  //High level
  study,

  //Low level
  get,
  deleteNode,
  runQuery, resolve1
}


