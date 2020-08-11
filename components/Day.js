const Continent = require("./Continent");
const Country = require("./Country");
const World = require("./World");

class Day {
	constructor() {
		// Stores each individual country
		this.countries = [];
		// Stores statistics from individual countries spanning across a continent
		this.continents = [];
		// Stores statistics from individual countries spanning across the world
		this.world = new World();
		// Stores geojson for all countries
		this.geojson = [];
	}

	// Adds data from a region within a country e.g. US State, however this could also contain all the country's data
	addData(cases, deaths, recovered, countryName, date, population, coordinates, continent, altSpellings) {
		// Searches for the country in the day
		const index = this.searchForCountry(countryName);
		let country;
		// Runs if the country was found in the database
		if (index > -1) {
			// Extracts and adds new data to the appropriate country
			country = this.countries[index];
			country.additionalData(cases, deaths, recovered);
		}
		// Runs if the country was not found in the database 
		else {
			// Creates and stores a new country in countries database
			country = new Country(cases, deaths, recovered, countryName, population, [coordinates[1], coordinates[0]], continent, altSpellings);
			this.countries.push(country);
		}
		// Stores data into continent and world objects
		this.world.additionalData(cases, deaths, recovered);
		this.processContinent(continent, cases, deaths, recovered);
		this.date = date;
		return country;
	}

	processContinent(name, cases, deaths, recovered) {
		// Searches for the contienent in the day
		const index = this.searchForContinent(name);

		// Runs if the continent was found in the database
		if (index > -1) {
			// Extracts and adds new data to the appropriate continent
			let contienent = this.continents[index];
			contienent.additionalData(cases, deaths, recovered);
		} else {
			// Creates and stores a new continent in continents database
			let continent = new Continent(name, cases, deaths, recovered);
			this.continents.push(continent);
		}
	}

	// Generates Geojson coordinates for all countries
	parseGeoJSON() {
		for (const country in this.countries) {
			try {
				this.geojson.push({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: this.countries[country].coordinates
					},
					properties: {
						title: this.countries[country].name,
						icon: "basketball",
						cases: this.countries[country].cases,
						deaths: this.countries[country].deaths,
						recovered: this.countries[country].recovered
					}
				});
			} catch (e) {
				console.error(`Error: Failed to parse country to generate Geojson`);
				console.error(`Country Object:\n ${this.countries[country]}`);
			}
		}
	}

	getCountryCoordinates(country) {
		if (this.countries[country.name]) return this.countries[country.name].coordinates
		console.error(`Error: Failed to lookup country coordinates for: ${country.name}`);
		return [0, 0];
	}

	// Returns the index of a chosen continent on the continents array
	searchForContinent(name) {
		return this.continents.findIndex(continent => continent.name == name);
	}

	// Returns the index of a chosen country on the countries array
	searchForCountry(countryName) {
		return this.countries.findIndex(country => country.name == countryName);
	}

	// Prints all data stored
	print() {
		console.log("Day: " + this.date);
		this.countries.forEach(country => country.print());
	}
}

module.exports = Day;
