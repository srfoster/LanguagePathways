let {Sentence, User} = require("./lib.js")
let util = require("./util.js")

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

  let ms = await bob.memories()

  expect(ms.map((m)=>m.id)).toContain(m.id)

  expect(ms[0].data).toBe("Helo World")


  await m.destroy() 
  let deadM = await util.getNode(m.id)
  expect(deadM).toBe(null);

  ms = await bob.memories()
  expect(ms.map((m)=>id)).not.toContain(m.id)

  bob.destroy() //Put in teardown

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

  console.log(bobM2_bobM)
  expect(bobM2_bobM.reason).toBe("Captioning my image")
  expect(aliceM_bobM2.reason).toBe("Commenting on Bob's image")
  
  //TODO: Move to teardown...
  bobM.destroy()
  bobM2.destroy()
  aliceM.destroy()
  bob.destroy()
  alice.destroy()
});

test('Users can "study" their things as flashcards', async () => {
  //Users create new "study sessions"?  "Study session type"  

  //Filter card fronts by type/metadata?  Filter backs by relationship from front to back 
});

test('Users can find other user\'s things and register interest in them', async () => {
});

