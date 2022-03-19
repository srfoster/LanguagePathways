
See `./lib/lib.test.js`
Run `./scripts/db-test` or `./scripts/db-dev` to start neo4j
Run `npm run test` to run the tests

Try the CLI!

PLUGIN_DIR=`pwd`/plugins/ ENV=DEV ./scripts/admin-user stephen

TODO:

* USE: Be able to back up database.  There are enough cards now to be paranoid about losing things! 

* CLI: Check that card due dates are being displayed correctly, past and future
* CLI: yes/no/cancel abstraction with support for non-recognized responses
* CLI: Be able to see how many cards are due vs not.  Basic stats.  

  TEST: Write some unit tests for due cards

* USE: Add next chess memory 
* USE: Add next piano memory

* USE: Add more cards if we get caught up with the current batch.

* CRUD:BUG: Updating a memory adds an extra :Has, causing the memory to show up twice in a users list

* USE: Create different SRSs (for Hanyu cards, for audio/mech turk?).  Make study take an srss id.  Control the type of study being done.  SRSs should have a name prop.
* USE: Decide how to represent chess tempo problems and/or positions from my own games.  Fen is nice.  A link back would be nice too though.

Milestones:
* Finish CLI, make it a useable replacement for Anki, for myself.
  - Create and study 100 new Chinese sentences
* Add REST interface with express
* Add React frontend
  - Browse memories
  - Add new memories
  - Do SRS studying 
* Make the sickest/coolest graph UI for organizing memories (3d?)



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
