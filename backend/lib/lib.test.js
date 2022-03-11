let {Sentence, User} = require("./lib.js")
let util = require("./util.js")

test('users can be created and destroyed', async () => {
  let bob = await User.create({username: "bob"})
  
  let id = bob.id
  expect(id).not.toBe(null);
  expect(bob.username).toBe("bob");
  await bob.destroy()

  let deadBob = await util.getNode(id)
  expect(deadBob).toBe(null);
});

test('users can create <things> and destroy them', async () => {
  let bob = await User.create({username: "bob"})

                          //renderer: EnglishTextComponent ???
  let t = bob.createThing({medium: "text", language: "English", data: "Hello World"})

  let ts = await bob.things()

  //Expect t to be in ts

  await t.destroy() 
  //Expect to be destroyed 

  ts = await bob.things()
  // Expect t to not be in ts 


});

test('Users can create new things and connect them to existing things', async () => {
  //Can create novel relationship types?  Or choose from specified types (To, etc.)
});

test('Users can "study" their things as flashcards', async () => {
  //Users create new "study sessions"?  "Study session type"  

  //Filter card fronts by type/metadata?  Filter backs by relationship from front to back 
});

test('Users can find other user\'s things and register interest in them', async () => {
});

