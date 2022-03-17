
let readline = require('readline-promise').default

const rli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function prompt(q){
  return rli.questionAsync(q)
}

let crud = {
  paginate: async (generator, show)=>{
    //Inefficient for now.

    let things = await generator() //should pass in current page when we make getCards actually work 

    while(things.length > 0){
      console.log(things.slice(0,10).map(show).join("\n"))

      let page = await prompt("Any key to continue") //Select page here?  Forward, backward?
      
      things = things.slice(10) 
    }

    return "That's all"
  },
  show: (resource_class, afterFind)=> {
    return async (cmd_parts)=>{
			let id = Number(cmd_parts.shift())
			let s = await resource_class.findById(id)
			return await afterFind(s)
    }
  },
  update: (resource_class, afterFind)=> {
    return async (cmd_parts)=>{
			let id = Number(cmd_parts.shift())
      let props = parse.kvs(cmd_parts.join(" "))

			let s = await resource_class.findById(id)
      s = await s.update(props)

			return s
    }
  },
  new: (resource_class, prop_names, construct)=>{
    return async (cmd_parts)=>{
      console.log("Cool, let's make a new " + resource_class.name)

      let props = {}
    
			for(let k of prop_names){
				const v  = await prompt(`  ${k}: `)
				props[k] = v
			}

			return await construct(props)
    }
  },
  rm: (resource_class)=>{
    return async (cmd_parts)=>{
      let id = Number(cmd_parts.pop())
      let m = await resource_class.findById(id)
      console.log(m)
      const ready = await prompt("Are you sure you want to delete this (y/N)? ")
      if(ready == "y" || ready == "Y"){
        await m.destroy()

        return resource_class.name + " destroyed"
      } else {
        return "That was a close one!"
      }
    }
  }

}

let parse = {
  kvs: (str) =>{
    //str might be the bit at the end of a cmd like:
    //  memories link 20 21 reason: "comments on", meta: true

    if(str.join) str = str.join(" ")

		let toEval = `temp = {${str}}`
		let evaled = eval(toEval)

    return evaled
  }
}

module.exports = {
  crud,
  prompt,
  parse
}
