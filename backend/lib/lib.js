let {Node,Edge,resolve1,resolveMany,runQuery, binds} = require("./util.js")


class Sentence extends Node{
  
}

class User extends Node{
  
}


binds({
  Sentence,
  User
})

module.exports = {
  Sentence,
  User
}
