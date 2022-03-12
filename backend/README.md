
See `./lib/lib.test.js`
Run `./db-test` or `./db-dev` to start neo4j
Run `npm run dev` to run the tests

TODO
* Persist SRS data in neo4j (current_question, current_answer)
* Make a CLI for studying
  - List memories
  - Add new memory
  - Do SRS studying
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
