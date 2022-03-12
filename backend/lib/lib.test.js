let {User} = require("./lib.js")
let util = require("./util.js")

afterEach(async () => {
  //Clear the DB
  await util.runQuery("MATCH (x)-[r]-() DELETE x,r")
});	

test('we can create and destroy users', async () => {
  let bob = await User.create({username: "bob"})
  
  let id = bob.id
  expect(id).not.toBe(null);
  expect(bob.username).toBe("bob");
  await bob.destroy()

  let deadBob = await util.getNode(id)
  expect(deadBob).toBe(null);
});


test('we can create and destroy memories for users', async () => {
  let bob = await User.create({username: "bob"})

                          //renderer: EnglishTextComponent ???
  let m = await bob.createMemory({medium: "text", language: "English", data: "Helo World"})

  let ms = await bob.getMemories()

  expect(ms.map((m)=>m.id)).toContain(m.id)

  expect(ms[0].data).toBe("Helo World")


  await m.destroy() 
  let deadM = await util.getNode(m.id)
  expect(deadM).toBe(null);

  ms = await bob.getMemories()
  expect(ms.map((m)=>id)).not.toContain(m.id)

});

test('we can link memories of a user, or between users', async () => {
  //Can create novel relationship types?  Or choose from specified types (To, etc.)
  let bob   = await User.create({username: "bob"})
  let alice = await User.create({username: "alice"})

                          //renderer: EnglishTextComponent ???
  let bobM = await bob.createMemory({medium: "image", language: "N/A", data: "1010001"})
  let bobM2 = await bob.createMemory({medium: "text",  language: "English", data: "First date with Alice"})

  let bobM2_bobM = await bobM2.link(bobM, {reason: "Captioning my image"}) 

  let aliceM = await alice.createMemory({medium: "text",  language: "English", data: "First date with Bob, aww cute"})
  let aliceM_bobM2 = await aliceM.link(bobM, {reason: "Commenting on Bob's image"})

  let incomingBobM   = await bobM.incomingMemories()
  let outgoingBobM   = await bobM.outgoingMemories()
  let outgoingAliceM = await aliceM.outgoingMemories()
  let outgoingBobM2  = await bobM2.outgoingMemories()

  expect(incomingBobM.length).toBe(2)
  expect(outgoingBobM.length).toBe(0)

  expect(outgoingBobM2.length).toBe(1)
  expect(outgoingAliceM.length).toBe(1)

  expect(bobM2_bobM.reason).toBe("Captioning my image")
  expect(aliceM_bobM2.reason).toBe("Commenting on Bob's image")
});

test('we can unlink a user\'s memories', async () => {
  let bob   = await User.create({username: "bob"})

                          //renderer: EnglishTextComponent ???
  let bobM = await bob.createMemory({medium: "image", language: "N/A", data: "1010001"})
  let bobM2 = await bob.createMemory({medium: "text",  language: "English", data: "First date with Alice"})
  let bobM2_bobM = await bobM2.link(bobM, {reason: "Captioning my image"}) 

  let incomingBobM   = await bobM.incomingMemories()

  expect(incomingBobM.length).toBe(1)

  await bobM2.unlink(bobM)

  incomingBobM   = await bobM.incomingMemories()
  expect(incomingBobM.length).toBe(0)
});

test('we can create an SRS for Users, and we can serve users flashcards to study', async () => {
  //Users create new "study sessions"?  "Study session type"  

  let bob   = await User.create({username: "bob"})
  let front = await bob.createMemory({medium: "text", language: "English", data: "Hello"})
  let back  = await bob.createMemory({medium: "audio",  language: "Chinese", data: "1010010"})

  front.link(back, {reason: "translates to", meta: "teacher said so"})

  let srs = await bob.createSRS(
     {question_language: ".*", 
      question_medium: ".*", 
      answer_language: ".*", 
      answer_medium: ".*"})

  let toStudy = await srs.getNextUnstudiedQuestion()

  expect(toStudy.id).toBe(front.id)

  let answer = await srs.getAnswer()

  expect(answer.id).toBe(back.id)

  await srs.markCorrect()

  toStudy = await srs.getNextUnstudiedQuestion()

  expect(toStudy).toBe(null) 

  let toStudyAgain = await srs.getNextStudiedQuestion()
  expect(toStudyAgain.id).toBe(front.id) 
});

test('we can serve users flashcards with spaced repetition features', async () => {
});


