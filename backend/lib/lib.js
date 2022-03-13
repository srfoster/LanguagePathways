let {Node,Edge,resolve1,resolveMany,runQuery, binds} = require("./util.js")


class Link extends Edge{

}

class SRS extends Node{
  async getNextUnstudiedQuestion(){
    let m = await resolve1("MATCH (u:User)-[:Has]->(m:Memory)-[:Link]->(m2:Memory) WHERE (NOT (m)-[:SRS]->(m2)) AND id(u)=$uId AND m.language =~ $mLanguage AND m.medium =~ $mMedium AND m2.language =~ $m2Language AND m2.medium =~ $m2Medium AND (u)-[:Has]->(m2) RETURN coalesce(m)", {uId: this.user_id, mLanguage: this.question_language, mMedium: this.question_medium, m2Language: this.answer_language, m2Medium: this.answer_medium })

    //Hmmm, no this needs to be an actual n4j edge...
    this.current_question = m

    return m 
  }

  async getNextStudiedQuestion(){
    let m = await resolve1("MATCH (u:User)-[:Has]->(m:Memory)-[:Link]->(m2:Memory), (m)-[s:SRS]->(m2) WHERE (s.times_right_in_a_row <= 3 OR localdatetime() > s.last_correct_at + duration({days: 2^(s.times_right_in_a_row-3)})) AND id(u)=$uId AND m.language =~ $mLanguage AND m.medium =~ $mMedium AND m2.language =~ $m2Language AND m2.medium =~ $m2Medium AND (u)-[:Has]->(m2) RETURN coalesce(m)", {uId: this.user_id, mLanguage: this.question_language, mMedium: this.question_medium, m2Language: this.answer_language, m2Medium: this.answer_medium })

    this.current_question = m

    return m
  }

  async getAnswer(){
    if(!this.current_question) throw new Error("You must call getQuestion() before getAnswer()")

    let m = await resolve1("MATCH (u:User)-[:Has]->(m2:Memory)<-[:Link]-(m:Memory) WHERE id(u)=$uId AND m.language =~ $mLanguage AND m.medium =~ $mMedium AND m2.language =~ $m2Language AND m2.medium =~ $m2Medium RETURN coalesce(m2)", {uId: this.user_id, mLanguage: this.question_language, mMedium: this.question_medium, m2Language: this.answer_language, m2Medium: this.answer_medium })

    this.current_answer = m 

    return m 
  }

  async markCorrect(){
    //Update any SRS-related edges...
    await runQuery("MATCH (m1:Memory),(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id MERGE (m1)-[s:SRS]->(m2) ON CREATE SET s = {last_correct_at: localdatetime(), times_right: 0, times_wrong: 0, times_right_in_a_row: 0} ON MATCH SET s += {last_correct_at: localdatetime(), times_right: s.times_right+1, times_right_in_a_row: s.times_right_in_a_row + 1}", {uId: this.user_id, m1Id: this.current_question.id, m2Id: this.current_answer.id })
  }

  async markIncorrect(){
    //Update any SRS-related edges...

    this.current_question = null
    this.current_answer = null
  }
}

class Memory extends Node{
  async link(m2, props){
    let l = await resolve1("MATCH (m1:Memory),(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id CREATE (m1)-[l:Link $props]->(m2) RETURN l", {m1Id: this.id, m2Id: m2.id, props})
    return l
  }  

  async unlink(m2){
    await runQuery("MATCH (m1:Memory)-[l:Link]->(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id DELETE l", {m1Id: this.id, m2Id: m2.id})
  }  

  async incomingMemories(){
    let ms = await resolveMany("MATCH (m1:Memory)<-[l:Link]-(m2:Memory) WHERE id(m1)=$m1Id RETURN distinct(m2)", {m1Id: this.id})

    return ms
  }

  async outgoingMemories(){
    let ms = await resolveMany("MATCH (m1:Memory)-[l:Link]->(m2:Memory) WHERE id(m1)=$m1Id RETURN distinct(m2)", {m1Id: this.id})

    return ms
  }
}

class User extends Node{
  async createOrFindMemory(props){
    let m = await Memory.createOrFind(props) 

    let h = await runQuery("MATCH (m:Memory),(u:User) WHERE id(u)=$id AND id(m)=$mId CREATE (u)-[h:Has {creator: true}]->(m) RETURN h", {id: this.id, mId: m.id})
    

    return m
  } 
 
  async getMemories(){
    let ms = await resolveMany("MATCH (u:User)-[:Has]->(m:Memory) WHERE id(u) = $id RETURN m", {id: this.id})

    return ms
  }

  async createOrFindSRS(props){
    let s = await SRS.createOrFind({question_language:".*",question_medium: ".*", answer_language: ".*", answer_medium: ".*", ...props}) 

    let h = await runQuery("MATCH (s:SRS),(u:User) WHERE id(u)=$id AND id(s)=$sId MERGE (u)-[h:Has {creator: true}]->(s) RETURN h", {id: this.id, sId: s.id})

    s.user_id = this.id

    return s
  } 

  async getSRSs(){
    let ss = await resolveMany("MATCH (u:User)-[:Has]->(s:SRS) WHERE id(u) = $id RETURN s", {id: this.id})

    ss.forEach((s)=>s.user_id = this.id)

    return ss
  }
}


binds({
  User,
  Memory,
  Link,
  SRS
})

module.exports = {
  Memory,
  User
}
