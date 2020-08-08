const Territory = require("./Territory");

class Continent extends Territory {
	constructor(name = "", cases = 0, deaths = 0, recovered = 0) {
		super(cases, deaths, recovered);
		this.name = name;
		this.population = this.getPopulation(name);
	}

	//
	// Population statistics from https://worldpopulationreview.com/continents/
	getPopulation(name) {
		switch (name) {
			case "Africa":
				return 1340598147;
			case "Americas":
				return 799629413;
			case "Asia":
				return 4641054775;
			case "Europe":
				return 747636026;
			case "Oceania":
				return 42677813;
			default:
				console.log("Error finding population for continent", this.name);
				return -1;
		}
	}
}

module.exports = Continent;
