const Territory = require("./Territory");

class World extends Territory {
	constructor() {
		super();
		// Population sourced from https://worldpopulationreview.com/continents/
		this.population = 7794798739;
	}

	additionalData(cases, deaths, recovered) {
		super.additionalData(cases, deaths, recovered);
	}

	print() {
		console.log("Global:", "\n\t");
		super.print();
	}
}

module.exports = World;
