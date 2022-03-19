let {Node,Edge,resolve1,resolveMany,resolvePath,resolvePathMany,runQuery, binds} = require("./util.js")


class Link extends Edge{

}

class SRSLink extends Edge{
  constructor(id,props){
    super(id,props)
    //TODO: Feels like this should be done based on some schema...
    this.times_right = this.times_right.toNumber()
    this.times_wrong = this.times_wrong.toNumber()
    this.last_correct_at_orig = this.last_correct_at
    this.last_correct_at = new Date(this.last_correct_at.toString()+"z") //z keeps it from doing a weird tz conversion...
    this.times_right_in_a_row = this.times_right_in_a_row.toNumber()
  }

	getDueDate(){
		var addDays        = require('date-fns/addDays')
		let days    = Math.pow(2,this.times_right_in_a_row) - 1
		let dueDate = addDays(this.last_correct_at, days)

		return dueDate
	}

	isDue(){
		var isFuture        = require('date-fns/isFuture')
		return !isFuture(this.getDueDate())
	}
}

class SRS extends Node{
  constructor(id,props){
    super(id,props) 

    this.props = this.props ? JSON.parse(this.props) : {}
  }


  async getNextUnstudiedQuestion(){
    let m_l_m2 = await resolvePath("MATCH (u:User)-[:Has]->(m1:Memory)-[l:Link]->(m2:Memory) WHERE (NOT (m1)-[:SRSLink]->(m2)) AND id(u)=$uId AND "+this.where+" AND (u)-[:Has]->(m2) RETURN (m1)-[:Link]->(m2) ORDER BY rand() LIMIT 1", {uId: this.user_id, ... this.props})

    if(!m_l_m2) return null

    await runQuery("MATCH (s:SRS)-[c:CurrentQuestion]->() DELETE c",{sId: this.id})
    await runQuery("MATCH (s:SRS)-[c:CurrentAnswer]->() DELETE c",{sId: this.id})

    await runQuery("MATCH (m:Memory),(s:SRS),(m2:Memory) WHERE id(m)=$mId AND id(m2)=$m2Id AND id(s)=$sId MERGE (s)-[:CurrentQuestion]->(m) MERGE (s)-[:CurrentAnswer]->(m2)",{mId: m_l_m2[0].id, m2Id: m_l_m2[2].id, sId: this.id})

    //Unclear when we should cache and when we should invalidate.  See getAnswer,getQuestion,etc.
    this.current_question = m_l_m2[0]
    this.current_link = m_l_m2[1]
    this.current_answer = m_l_m2[2]

    return m_l_m2[0]
  }

  //Looking pretty similar to the above function.  Refactor?
  async getNextStudiedQuestion(){
    let m_l_m2 = await resolvePath("MATCH (u:User)-[:Has]->(m1:Memory)-[l:Link]->(m2:Memory), (m1)-[s:SRSLink]->(m2) WHERE (localdatetime() > s.last_correct_at + duration({days: 2^s.times_right_in_a_row - 1})) AND id(u)=$uId AND " +this.where+ " AND (u)-[:Has]->(m2) RETURN (m1)-[:Link]->(m2) ORDER BY rand() LIMIT 1", {uId: this.user_id, ... this.props}) 

    if(!m_l_m2) return null

    await runQuery("MATCH (s:SRS)-[c:CurrentQuestion]->() DELETE c",{sId: this.id})
    await runQuery("MATCH (s:SRS)-[c:CurrentAnswer]->() DELETE c",{sId: this.id})

    await runQuery("MATCH (m:Memory),(s:SRS),(m2:Memory) WHERE id(m)=$mId AND id(m2)=$m2Id AND id(s)=$sId MERGE (s)-[:CurrentQuestion]->(m) MERGE (s)-[:CurrentAnswer]->(m2)",{mId: m_l_m2[0].id, m2Id: m_l_m2[2].id, sId: this.id})

    //Unclear when we should cache and when we should invalidate.  See getAnswer,getQuestion,etc.
    this.current_question = m_l_m2[0]
    this.current_link = m_l_m2[1]
    this.current_answer = m_l_m2[2]

    return m_l_m2[0]
  }

  async getAnswer(){
    let m = await resolve1("MATCH (s:SRS)-[c:CurrentAnswer]->(m:Memory) WHERE id(s)=$sId RETURN m",{sId: this.id})

    return m 
  }

  async getQuestion(){
    let m = await resolve1("MATCH (s:SRS)-[c:CurrentQuestion]->(m:Memory) WHERE id(s)=$sId RETURN m",{sId: this.id})

    return m 
  }

  async markCorrect(){
    let a = await this.getAnswer()
    let q = await this.getQuestion()

    await runQuery("MATCH (m1:Memory),(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id MERGE (m1)-[s:SRSLink]->(m2) ON CREATE SET s = {srs_id: $sId, last_correct_at: localdatetime(), times_right: 1, times_wrong: 0, times_right_in_a_row: 1} ON MATCH SET s += {last_correct_at: localdatetime(), times_right: s.times_right+1, times_right_in_a_row: s.times_right_in_a_row + 1}", {uId: this.user_id, m1Id: q.id, m2Id: a.id, sId: this.id })
  }

  async markIncorrect(){
    let a = await this.getAnswer()
    let q = await this.getQuestion()

    await runQuery("MATCH (m1:Memory),(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id MERGE (m1)-[s:SRSLink]->(m2) ON CREATE SET s = {srs_id: $sId, last_correct_at: localdatetime(), times_right: 0, times_wrong: 1, times_right_in_a_row: 0} ON MATCH SET s += { times_wrong: s.times_wrong+1, times_right_in_a_row: 0}", {uId: this.user_id, m1Id: q.id, m2Id: a.id, sId: this.id })
  }

  async getCards(){
    let ps = resolvePathMany("MATCH (m:Memory)-[s:SRSLink]->(m2:Memory) WHERE s.srs_id=$sId RETURN (m)-[s]->(m2)", {sId: this.id}) 

    return ps 
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

  async createOrFindSRS(where,props){
    //let s = await SRS.createOrFind({question_language:".*",question_medium: ".*", answer_language: ".*", answer_medium: ".*", ...props}) 
    let s = await SRS.createOrFind({where:where, props: JSON.stringify({question_language:".*",question_medium: ".*", answer_language: ".*", answer_medium: ".*", link_reason: "translates to", ...props})})

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
  SRS,
  SRSLink
})

module.exports = {
  Memory,
  User,
  SRS
}
