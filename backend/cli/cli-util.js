
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
  show: (resource_class, afterFind)=> {
    return async (cmd_parts)=>{
			let id = Number(cmd_parts.pop())
			let s = await resource_class.findById(id)
			return await afterFind(s)
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

module.exports = {
  crud,
  prompt
}
