const Territory = require("./Territory")

class Country extends Territory {
	constructor(
		cases = 0,
		deaths = 0,
		recovered = 0,
		name = '',
		population = 0,
		coordinates = [],
		continent = '',
		altSpellings = []
	) {
		super(cases, deaths, recovered);
		this.name = name;
		this.population = parseInt(population);
		this.coordinates = coordinates;
		this.continent = continent;
		this.altSpellings = altSpellings;
		this.calculate();
	}

	print() {
		console.log('Country: ', this.name, "\t");
		super.print();
		console.log('Population', this.population, "\t", 'Coordinates', this.coordinates, "\t", 'Continent', this.continent, "\t", 'Alt-Spellings', this.altSpellings);
	}
}

module.exports = Country;