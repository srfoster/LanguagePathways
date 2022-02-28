

//TESTS

//TODO: More sentences
//  Deal with capitalization idiosyncrasies
    ni ai wo -> "you love Me"

//TODO: Filter out attempts for sentences that have no targets via that attempt's attempt types... (Dead ends.  Learning only happens when you traverse a :To relation...)

//TODO: Pinyn + Russian phonetics

//TODO: Russian/Chinese audio solution 

//TODO: js indentation plugin
//TODO: Start building UI (other package?)
//TODO: user/ownership/multiplayer/gamification/social features

How to study as a particular user

```
node -e 'require("./util").study(32)'
```

Useful cypher for viewing the whole dataset

```
match (s:Sentence),(w:Word),(u:User),(a:Attempt) return s,w,u,a
```
