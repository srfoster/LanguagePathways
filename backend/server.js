const express = require("express")
const cors = require('cors')
const app = express()

app.use(cors())

const port = 8000


let lp = require("./util.js")


app.get('/users/:user_id/sentences/random', async (req, res) => {
  let u = await lp.get(parseInt(req.params.user_id))

  let s = await u.getRandomInterestingSentence()
  console.log(s)
  
  res.send(s.toJson())
})


app.get('/users/:user_id/sentences/:sentence_id', async (req, res) => {
  let s = await lp.get(parseInt(req.params.sentence_id))
  let i = await lp.resolve1("MATCH (u)-[i:Interest]->(s) WHERE id(u) = $user_id AND id(s) = $sentence_id RETURN i", {sentence_id: parseInt(req.params.sentence_id), user_id: parseInt(req.params.user_id)})

  console.log(s,i)

  res.send({sentence: s.toJson(), targets: await i.targetSentences()})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
