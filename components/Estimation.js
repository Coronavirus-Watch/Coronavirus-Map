const fs = require("fs");

const CONTAGION_PATH = __dirname + "/../data/contagion.csv";

class Estimation {
  constructor() {
    this.spread = [];
    this.processContagion();
    return this;
  }
  processContagion() {
    const file = fs.readFileSync(CONTAGION_PATH, "utf8");
    const snippet = file.split("\n");
    let lines = [];
    snippet.forEach(snip => {
      lines.push(snip.split(","));
    });

    for (let i = 1; i < lines[2].length; i++) {
      try {
        let obj = {
          cases: parseInt(lines[2][i].trim()),
          fromChina: parseInt(lines[5][i].trim()),
          community: parseInt(lines[6][i].trim()),
          shareChina: lines[7][i].trim().replace("%", "") / 100,
          shareCommunity: lines[8][i].trim().replace("%", "") / 100
        };
        this.spread.push(obj);
      } catch (e) {
        console.error(e);
      }
    }
  }

  lookup(cases) {
    if (cases > 200) {
      return 0.01;
    }
    if (cases <= 100) {
      return this.spread[cases - 1].shareCommunity;
    }
    return 0.11 + 0.0007 * cases - 0.000006 * cases * cases;
  }

  print() {
    console.log(this.spread);
  }
}

module.exports = Estimation;