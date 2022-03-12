let {Node,Edge,resolve1,resolveMany,runQuery, binds} = require("./util.js")


class Link extends Edge{

}

class Memory extends Node{
  async link(m2, props){
    let l = await resolve1("MATCH (m1:Memory),(m2:Memory) WHERE id(m1)=$m1Id AND id(m2)=$m2Id CREATE (m1)-[l:Link $props]->(m2) RETURN l", {m1Id: this.id, m2Id: m2.id, props})
    return l
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
  async createMemory(props){
    let m = await Memory.create(props) 

    let h = await runQuery("MATCH (m:Memory),(u:User) WHERE id(u)=$id AND id(m)=$mId CREATE (u)-[h:Has {creator: true}]->(m) RETURN h", {id: this.id, mId: m.id, props})
    

    return m
  } 
 
  async memories(){
    let ms = await resolveMany("MATCH (u:User)-[:Has]->(m:Memory) WHERE id(u) = $id RETURN m", {id: this.id})

    return ms
  }
}


binds({
  User,
  Memory,
  Link
})

module.exports = {
  Memory,
  User
}
