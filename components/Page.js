// just create a new route in index?

// app.get("/country") or something, I'm not sure the syntax

// is this to display connections for each country?
// yeah i can imagine you can just do or /China and it fetches the data from the Timeline
// and it prints out the returned data (but in html and formatted)
// i know you can do res.sendHTML() or something like that

const express = require("express");
const app = express();
const port = 3002;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));