let {User, Memory, SRS} = require("../lib/lib.js")
let username = process.env.CURRENT_USER
let user     

let readline = require('readline-promise').default

const rli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function prompt(q){
  return rli.questionAsync(q)
}

async function adminUser(){
  user = await User.createOrFind({username: username})
  console.log(`Welcome ${username}!  What would you like to do?`)
  repl(cmds)
}

async function repl(cmds){
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

async function srss(cmd_parts){
  //List srss
  if(cmd_parts.length == 0)
    return user.getSRSs()

  let id = Number(cmd_parts.pop())
  let s = await SRS.findById(id)
  return await s.getCards()
}

function memories(cmd_parts){
  //List memories
  if(cmd_parts.length == 0)
    return user.getMemories()

  let cmds = {
    new: async (cmd_parts)=>{
      console.log("Cool, let's make a new memory")
      const data     = await prompt("  data: ")
      const language = await prompt("  language: ")
      const medium    = await prompt("  medium: ")
      
      return await user.createOrFindMemory({data,language,medium}) 
    },
    rm: async (cmd_parts)=>{
      let id = Number(cmd_parts.pop())
      let m = await Memory.findById(id)
      console.log(m)
      const ready = await prompt("Are you sure you want to delete this memory (y/N)? ")
      if(ready == "y" || ready == "Y"){
        await m.destroy()

        return "Memory destroyed"
      } else {
        return "That was a close one!"
      }
    },
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
    show: async (cmd_parts)=>{
      let id = Number(cmd_parts.pop())
      let m = await Memory.findById(id)
      console.log("OUT:", await m.outgoingMemories())
      console.log("IN:",  await m.incomingMemories())
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

  console.log(q)
  console.log(srs.current_link)

	await prompt("Press any key to see the answer") 

  let a = await srs.getAnswer()

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
