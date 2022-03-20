let {User, Memory, SRS} = require("../lib/lib.js")
let {crud, prompt, parse} = require("./cli-util.js")

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
      //TODO: Will get less efficient the more mems we have,
      //      Need to accomplish this without loading whole dataset into memory.
			let all = await s.getCards()
      all = all.sort((a,b)=>a[1].getDueDate()-b[1].getDueDate())
      console.log("Total cards:", all.length)
      console.log("Due:", all.filter((triplet)=>triplet[1].isDue()).length)

      await crud.paginate(()=>all, 
        (triplet)=>{
           var formatDistanceToNow = require('date-fns/formatDistanceToNow')

			     let dueDate = triplet[1].getDueDate()

           return `${triplet[1].isDue() ? "-" : "+"} ${formatDistanceToNow(dueDate)} ${triplet[0].data} -> ${triplet[2].data}`
       })
    })
  }

  const func = cmds[cmd_parts[0]]
  cmd_parts.shift()
  return func(cmd_parts)
}

let memories = async(cmd_parts)=>{
  if(cmd_parts.length == 0)
    return await crud.paginate(()=>user.getMemories(), (m)=>{ return `  ${m.id} ${m.data}` })

  let cmds = {
    stats: async (cmd_parts)=>{ 
      //TODO: Will get less efficient the more mems we have,
      //      Need to accomplish this without loading whole dataset into memory.
      let all = await user.getMemories()

      let count = all.length

      console.log(count) 
    },
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
      let props = parse.kvs(cmd_parts.slice(2).join(" "))

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
  //TODO: Too specific for me/chinese.  Extract
  let srs = await user.createOrFindSRS("m1.language =~ '.*' AND m1.medium =~ '.*' AND m2.language =~ '.*' AND (NOT m2.medium =~ 'text/hanyu')  AND m2.medium =~ $answer_medium AND l.reason = $link_reason", {})

  //console.log("SRS", srs)

  let q = await srs.getNextUnstudiedQuestion()

  if(!q){
    console.log("No new cards to create...")
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

async function js(cmd_parts){
  return eval(cmd_parts.join(" "))
}


//Top level commands
let cmds = {
  help, memories, study, srss, js
}

//Plus any plugins...

let PLUGIN_DIR = process.env.PLUGIN_DIR
if(PLUGIN_DIR){
	//read files in plugins directory and call plugin on each path..

	async function plugin(file){
		if(!file.endsWith(".js")) return

			let newCmdF = require(PLUGIN_DIR+"/"+file).main

				cmds[file.replace(".js","")] = newCmdF
	}

	var fs = require('fs');
	var files = fs.readdirSync(PLUGIN_DIR);

	files.map(plugin)
}


module.exports = {
  adminUser
}
