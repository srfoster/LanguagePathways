
How to study as a particular user

```
node -e 'require("./util").study(32)'
```

Useful cypher for viewing the whole dataset

```
match (s:Sentence),(w:Word),(u:User),(a:Attempt) return s,w,u,a
```
