const express = require("express")
const cors = require('cors')
const app = express()

app.use(cors())

const port = 8000


let lp = require("./util.js")
app.get('/users/:id/unattempted', async (req, res) => {
  let u = await lp.get(32)
  let as = await u.getAttempts() 
  res.send(as.map((a)=>a.toJson()))
})

//TODO: Maybe shouldn't call this an "attempt"? "Interest"? Or "user sentence"?  IDK
app.get('/attempts/:id', async (req, res) => {
  let a = await lp.get(parseInt(req.params.id))

  let s = await a.getSentence()
  
  res.send(s.data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
