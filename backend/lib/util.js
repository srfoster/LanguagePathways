//let debug = true
let debug = false

let env = require("../env.js")[process.env.ENV]

const dateFns = require('date-fns')
const neo4j = require('neo4j-driver')
const driver = neo4j.driver(env.uri, neo4j.auth.basic(env.uname, env.pword))
//NOTE: should call close() on driver...

async function runQuery(s, d){

  const session = driver.session()

	if(debug) console.log(s, d)
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
  destroy(){
    return deleteNode(this.id) 
  }
}
Node.create = function(properties){
  return createNode(this.name, properties)
}

async function resolve1(s,d){
  let x = await runQuery(s,d)

  if(!x.records[0]) return null

  let data = x.records[0].get(0)

  return wrap(data)
}


let bindings;
function binds(the_bindings){
  bindings = the_bindings
}

function wrap(data){
  let Type  

  for(let k of Object.keys(bindings)){
    //Node
    if(data.labels && data.labels.indexOf(k)>=0){
      Type = bindings[k]
      break
    }
    //Edge (why different?)
    if(data.type == k){
      Type = bindings[k]
      break
    }
  }

  if(!Type) throw Error("Could not find constructor for: "+ JSON.stringify(data))

  return new Type(neo4j.int(data.identity).toNumber(), data.properties || {})
}

async function resolveMany(s,d){
  let x = await runQuery(s,d)

  if(!x.records[0]) return []

  return x.records.map((r)=>wrap(r.get(0)))
}

async function getNode(id){
  return await resolve1(
    'MATCH (x) WHERE id(x) = $id RETURN x',
    {id}) 
}

//Can we figure out how to do this with one query?
async function deleteNode(id){
  await runQuery("MATCH (x)-[r]-(y) WHERE id(x) = $id DELETE x,r", {id})
  await runQuery("MATCH (x) WHERE id(x) = $id DELETE x", {id})
}

//Probably can be target of injection attacks with weird props
//  Don't pass user data into this function (at least not in the keys of the props)
function createNode(type_name, props){
  let prop_string = Object.keys(props).map((p)=>p+": $"+p).join(",")
  return resolve1("MERGE (x:"+type_name+" {"+prop_string+"}) RETURN x", props) }


module.exports = {
  binds,
  resolveMany,
  resolve1,
  runQuery,
  getNode,
  Node,
  Edge,
}


