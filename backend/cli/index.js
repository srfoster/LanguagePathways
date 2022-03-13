let {User, Memory, SRS} = require("../lib/lib.js")
let {crud, prompt} = require("./cli-util.js")
let username = process.env.CURRENT_USER
let user     

let adminUser = async()=>{
  user = await User.createOrFind({username: username})
  console.log(`Welcome ${username}!  What would you like to do?`)
  repl(cmds)
}

let repl = async(cmds)=>{
  while(true){
    //Read
    const cmd_parts = (await prompt(username+"> ")).split(" ")

    //Eval
    let func;
    try{
      func = cmds[cmd_parts[0]]
      cmd_parts.shift() 
      let result = await func(cmd_parts)
      //Print
      console.log(result)
    }catch(e){
      //Print
      console.log(e)
    }
  }
}

function help(cmd_parts){
  return Object.keys(cmds).join(" ") 
}

let srss = async (cmd_parts)=>{
  if(cmd_parts.length == 0)
    return user.getSRSs()

  let cmds = {
    new: crud.new(SRS, ["question_language","question_medium", "answer_language", "answer_medium", "link_reason"], (props)=>user.createOrFindSRS(props)),
    rm: crud.rm(SRS),
    update: crud.update(SRS, (s)=>{
      return s
    }),
    show: crud.show(SRS, async (s)=>{
      return (await s.getCards()).map((triplet)=>{
       return {
         from: triplet[0].data,
         to: triplet[2].data,
         meta: triplet[1]
       }
      })
    })
  }

  const func = cmds[cmd_parts[0]]
  cmd_parts.shift()
  return func(cmd_parts)
}

let memories = async(cmd_parts)=>{
  if(cmd_parts.length == 0)
    return user.getMemories()

  let cmds = {
    new: crud.new(Memory, ["data", "language", "medium"], (props)=>user.createOrFindMemory(props)),
    rm: crud.rm(Memory),
    update: crud.update(Memory, (m)=>{
      return m
    }),
    show: crud.show(Memory, async (m)=>{
      console.log(m)
      console.log("OUT:", await m.outgoingMemories())
      console.log("IN:",  await m.incomingMemories())
    }),
    link: async (cmd_parts)=>{
      let id1 = Number(cmd_parts[0])
      let id2 = Number(cmd_parts[1])
      let props = JSON.parse((cmd_parts.slice(2).join(" ")||"{}"))

      let m1 = await Memory.findById(id1)
      let m2 = await Memory.findById(id2)

      await m1.link(m2, props)

      console.log(m1,m2)

      return "Link established!"
    },
  }

  const func = cmds[cmd_parts[0]]
  cmd_parts.shift()
  return func(cmd_parts)
}

async function study(cmd_parts){
  let srs = await user.createOrFindSRS({})
  let q = await srs.getNextUnstudiedQuestion()

  if(!q){
    q = await srs.getNextStudiedQuestion()
  }

  if(!q){
    return "Looks like you're done for now!" 
  }

  let a = await srs.getAnswer()

  console.log(q)
  console.log(srs.current_link)
  console.log("TO", a.language, a.medium)

	await prompt("Press any key to see the answer") 

  console.log(a)

	let markCorrect = await prompt("  Were you right (y/N)?") 
	if(markCorrect == "y" || markCorrect == "Y"){
		await srs.markCorrect()
	  return "Nice! :)"
	} else {
		await srs.markIncorrect()
		return "Better luck next time"
	}

  return "TODO" 
}


//Top level commands
let cmds = {
  help, memories, study, srss
}

module.exports = {
  adminUser
}
