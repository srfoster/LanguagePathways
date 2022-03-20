let {User, Memory, SRS} = require("../lib/lib.js")
let {crud, prompt, parse} = require("../cli/cli-util.js")

let main = async (cmd_parts) =>{
  user = await User.createOrFind({username: process.env.CURRENT_USER})

  let cmds = {
    new: async (cmd_parts)=>{
      let english = await prompt("English: ")

      let toExpand  = await user.createOrFindMemory({
        data: english,
        language: "English",
        medium: "text"
      }) 

      let hanyu  = await prompt("  Hanyu: ")
      let pinyin = await prompt("  Pinyin: ")

      await expandEnglish(toExpand, hanyu, pinyin)
    },
    expand: async (cmd_parts)=>{
      let id = Number(cmd_parts.shift())

      let toExpand = await Memory.findById(id)

      console.log("Expanding",toExpand)

      //let {hanyu,pinyin} = parse.kvs(cmd_parts)
      let hanyu  = await prompt("  Hanyu: ")
      let pinyin = await prompt("  Pinyin: ")

      await expandEnglish(toExpand, hanyu, pinyin)
    }
  }      

  let cmd = cmd_parts.shift().trim()
  return await cmds[cmd](cmd_parts)
}

let expandEnglish = async (toExpand,hanyu,pinyin)=>{
	console.log("Hanyu:",hanyu)  
	console.log("Pinyin:",pinyin)  

		let yes = await prompt("Do you want to continue?")

		if(yes == "y" || yes == "Y"){
			let hanyuMemory = await user.createOrFindMemory({data:hanyu, language:"Chinese", medium: "text/hanyu"})
				let pinyinMemory = await user.createOrFindMemory({data:pinyin, language:"Chinese", medium: "text/pinyin"})

				await hanyuMemory.link(pinyinMemory, {reason: "translates to"})
				await pinyinMemory.link(hanyuMemory, {reason: "translates to"})

				await hanyuMemory.link(toExpand, {reason: "translates to"})
				await toExpand.link(hanyuMemory, {reason: "translates to"})

				await pinyinMemory.link(toExpand, {reason: "translates to"})
				await toExpand.link(pinyinMemory, {reason: "translates to"})

				console.log("Created 2 new memories and 6 new links!") 
		} 
}
   
module.exports = {
  main 
}
