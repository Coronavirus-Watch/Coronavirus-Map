const Continent = require("./Continent");
const Country = require("./Country");
const World = require("./World");

class Day {
  constructor() {
    // Stores whether this is an estimated day not based on official figures
    this.isEstimation = false;
    // Stores each individual country
    this.countries = [];
    // Stores statistics from individual countries spanning across a continent
    this.continents = [];
    // Stores statistics from individual countries spanning across the world
    this.world = new World();
    // Stores geojson
    this.geojson = [];
  }

  // Adds data from a region
  addData(
    cases,
    deaths,
    recovered,
    countryName,
    date,
    population,
    coordinates,
    continent,
    altSpellings
  ) {
    let index = this.searchForCountry(countryName);
    let country;
    if (index > -1) {
      country = this.countries[index];
      country.additionalData(cases, deaths, recovered);
    } else {
      country = new Country(
        cases,
        deaths,
        recovered,
        countryName,
        population,
        [coordinates[1], coordinates[0]],
        continent,
        altSpellings
      );
      index = this.countries.length;
      this.countries[index] = country;
    }
    // TODO: Process continent and world info
    this.world.additionalData(cases, deaths, recovered);
    this.processContinent(continent, cases, deaths, recovered);
    this.date = date;
    return country;
  }

  processContinent(name, cases, deaths, recovered) {
    // Checks if continent exists on array
    const contienentIndex = this.searchContinent(name);

    if (contienentIndex > -1) {
      // Adds additional data to appropriate continent
      let contienent = this.continents[contienentIndex];
      contienent.additionalData(cases, deaths, recovered);
    } else {
      // Adds new continenet
      let continent = new Continent(name, cases, deaths, recovered);
      this.continents[this.continents.length] = continent;
    }
  }

  // Returns the index of a chosen continent on the continents array
  searchContinent(name) {
    return this.continents.findIndex(continent => continent.name == name);
  }

  parseGeoJSON() {
    let tempArray = [];
    if (this.countries) {
      for (let country in this.countries) {
        try {
          tempArray.push({
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
          console.log(e);
        }
      }
    }
    this.geojson = tempArray;
  }

  getCountryCoordinates(country) {
    if (this.countries[country.name]) {
      return this.countries[country.name].coordinates;
    }
    console.log("Country Not Found: " + country.name);
    return [0, 0];
  }

  // Checks if a country is on the array
  searchForCountry(countryName) {
    return this.countries.findIndex(country => country.name == countryName);
  }

  // Prints all data stored
  print() {
    console.log("Day: " + this.date);
    this.countries.forEach(element => {
      element.print();
    });
  }
}

module.exports = Day;
