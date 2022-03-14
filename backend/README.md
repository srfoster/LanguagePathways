
See `./lib/lib.test.js`
Run `./scripts/db-test` or `./scripts/db-dev` to start neo4j
Run `npm run test` to run the tests

Try the CLI!

ENV=DEV ./scripts/admin-user stephen

TODO:
* USE: Add some actual memories that I care about
   - What is necessary to make this useable for myself? 
* USE: Make more srss, one for each zhong of card.  Make study take an srs id.  Control the type of study being done.  SRSs should have a name prop
* SRS: Make sure marking incorrect works
* SRS: Seems like fresh cards take too long.  Tedious.  Should allow this to be set at the SRS level (number of tries while new).  Abstract then find the perfect number.
  - Double check the logic while we're at it and doc somewhere


Milestones:
* Finish CLI, make it a useable replacement for Anki, for myself
* Add REST interface with express
* Add React frontend
  - Browse memories
  - Add new memories
  - Do SRS studying 




----

//OLD

//TODO: Start building UI (other package?)
//  REST API for doing study.  TODO: Represent current card in data, user has a location, can choose paths based on that...?

//TODO: More sentences
//  Deal with capitalization idiosyncrasies
    ni ai wo -> "you love Me"

//TODO: Filter out attempts for sentences that have no targets via that attempt's attempt types... (Dead ends.  Learning only happens when you traverse a :To relation...)

//TODO: Pinyn + Russian phonetics

//TODO: Russian/Chinese audio solution 

//TODO: js indentation plugin
//TODO: user/ownership/multiplayer/gamification/social features

How to study as a particular user
