
See `./lib/lib.test.js`
Run `./scripts/db-test` or `./scripts/db-dev` to start neo4j
Run `npm run test` to run the tests

Try the CLI!

ENV=DEV ./scripts/admin-user stephen

TODO:
* USE: Add some actual memories that I care about
    > ??? 

* USE: Make more srss, one for each zhong of card.  Make study take an srss id.  Control the type of study being done.  SRSs should have a name prop
* USE: Decide how to represent chess tempo problems and/or positions from my own games.  Fen is nice.  A link back would be nice too though.
* USE: Start learning River Flows In You 
* CRUD: Pagination
* SRS: Make sure marking incorrect does something


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
