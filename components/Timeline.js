/*
	Required Imports
 */
const path = require('path');

// Imports our external modules
const { downloadDateToStorageDate, downloadDateToDateObj } = require(path.join(__dirname, '../utils/dateUtils'));
const { fetchCountryDetails } = require(path.join(__dirname, '../utils/downloadUtils'));
const Day = require("./Day");

/*
	User constants
 */
// const FUTURE_DAYS = 0;

/*
	Class
 */
class Timeline {
	constructor() {
		this.days = [];
	}

	async init(files) {
		// Fetches country details such as population for all countries
		this.worldDetails = await fetchCountryDetails();
		// Processes 
		await this.processFiles(files);
		// await this.futureDays();
		await this.genGeoJSON();
		// console.log(this.days);
		// console.log(await this.days[0]);
		return await this.days;
	}

	async processFiles(files) {
		// Loops through each file, creating a new Day instance and extra data
		// parsing
		files.forEach(async day => {
			await this.processDay(day[0], day[1]);
		});
		return;
	}

	// Process a file representing the coronavirus statistics by country for that
	// day
	processDay(filename, content) {
		let day = new Day();
		// Prevents commas within quotes from messing up the seperation
		content = this.dealsWithQuoteMarks(content);
		// Seperating each lines
		const lines = content.split("\n");

		for (let row = 1; row < lines.length; row++) {
			// Segments each line
			const regionLine = lines[row].split(",", -1);

			// Makes any elements that are blank 0
			for (let column = 1; column < regionLine.length; column++) {
				if (!regionLine[column] || regionLine[column].includes("\r")) regionLine[column] = "0"
			}

			// Extracts data from the line and adds it to the appropriate day
			if (typeof regionLine[1] !== "undefined") this.extractData(day, filename, regionLine);
		}

		this.days.push(day);
		return;
	}

	extractData(day, filename, regionLine) {
		// Calculates storage date using the downloaded filename
		const storageDate = downloadDateToStorageDate(filename);
		const countryStats = this.getCountryStats(filename, regionLine);
		// Blank entry was detected
		if (countryStats === -1) {
			return;
		}
		// Looks up other information from country details array
		const countryDetails = this.searchCountryDetails(countryStats.searchName);
		// 
		this.mergeData(day, storageDate, countryStats, countryDetails);
	}

	getCountryStats(filename, regionLine) {
		try {
			const cutOff = new Date(2020, 3, 22);
			const dateObj = downloadDateToDateObj(filename);
			// Determines which country statistics extractor to use
			if (dateObj < cutOff) {
				return this.getCountryStatsV1(regionLine);
			}
			else {
				return this.getCountryStatsV2(regionLine);
			}
		} catch (error) {
			console.error("Invalid Country Statistics Process, likely caused by undefined component or changed storage on server\n");
			console.error("regionLine: " + regionLine + "\n");
			console.error(error);
		}
	}

	getCountryStatsV1(regionLine) {
		// Extracts cases from the region line
		const cases = regionLine[3].trim();
		// Checks if the entry is blank
		if (cases <= 0) {
			return -1;
		}
		// Changes country names from downloaded files into ones that are used to store countries
		const countryName = this.dictStore(regionLine[1].trim());

		const countryStats = {
			cases: cases,
			countryName: countryName,
			// Extracts more constants from the region line
			deaths: regionLine[4].trim(),
			recovered: regionLine[5].trim(),
			// Changes country nams from the ones stored to lookup data in the Rest countries API
			searchName: this.dictRest(countryName)
		}
		return countryStats;
	}

	getCountryStatsV2(regionLine) {
		// Extracts cases from the region line
		const cases = regionLine[7].trim();
		// Checks if the entry is blank
		if (cases <= 0) {
			return -1;
		}
		// Changes country names from downloaded files into ones that are used to store countries
		const countryName = this.dictStore(regionLine[3].trim());

		const countryStats = {
			cases: cases,
			countryName: countryName,
			// Extracts more constants from the region line
			deaths: regionLine[8].trim(),
			recovered: regionLine[9].trim(),
			// Changes country nams from the ones stored to lookup data in the Rest countries API
			searchName: this.dictRest(countryName)
		}
		return countryStats;
	}

	// Extracts data from the line and adds it to the appropriate day
	mergeData(day, storageDate, countryStats, countryDetails) {
		try {
			// Extracts coronavirus information
			const { cases, deaths, recovered, countryName, searchName } = countryStats;

			// Checks for country details lookup error 
			if (typeof countryDetails === "undefined") throw "Error finding country details for: " + searchName;

			// Extracts country details information
			const { population, latlng, region: continent, altSpellings } = countryDetails;

			// Adds data to the day
			let country = day.addData(cases, deaths, recovered, countryName, storageDate, population, latlng, continent, altSpellings);

			// 
			this.compareData(country, countryName);

		} catch (error) {
			// console.log('General Error for: ' + searchName);
			console.error(error);
		}
	}

	// 
	compareData(country, countryName) {
		// Extracts data from yesterdays result
		let varsArray = [0, 0, 0, 0];
		let yesterday;
		let index = -1;
		if (this.days.length !== 0) {
			yesterday = this.days[this.days.length - 1];
			index = yesterday.searchForCountry(
				countryName
			);
		}
		if (index !== -1) {
			let countryYesterday = yesterday.countries[index];
			varsArray = countryYesterday.getVarsArray();
		}
		// Compares data from this day and the previous to calculate increases
		country.comparison(varsArray);
	}

	// Prevents commas within quotes in a csv file from messing up the seperation
	dealsWithQuoteMarks(content) {
		let inQuote = false;
		for (let index = 0; index < content.length; index++) {
			let element = content.charAt(index);
			if (inQuote && element === ",") {
				// Deletes element
				content = content.slice(0, index) + content.slice(index + 1, content.length);
			} else if (element === '"') {
				// Deletes element
				content = content.slice(0, index) + content.slice(index + 1, content.length);
				inQuote = !inQuote;
			}
		}
		return content;
	}

	// Looks up information about a country from the country details array
	searchCountryDetails(name) {
		return this.worldDetails.filter(country => {
			if (country.name === name) return true;
			return country.altSpellings.includes(name);
		})[0];
	}

	// Gets the highest value of a property in the days array
	getMax(type) {
		let max = 0;
		this.currentDay.forEach(feature => {
			if (feature.properties[type] > max) {
				max = feature.properties[type];
			}
		});
		return max;
	}

	// Gets geojson data for a particular day
	async retrieveDay(index) {
		try {
			return await this.days[index].geojson;
		}
		catch {
			console.error(`Error: Failed to retrieve Geojson for day ${index}`);
			console.error(`Days Array: ${this.days}`);
			console.error(`Days Array typeof: ${typeof this.days}`);
		}
	}

	// Generates geojson data for all days
	async genGeoJSON() {
		this.days.forEach(day => {
			day.parseGeoJSON();
		});
	}

	// // Creates the days in the future that are predictions
	// futureDays() {
	// 	// Helps generate the formatted date
	// 	let today = new Date();
	// 	today.setHours(0, 0, 0, 0);

	// 	// Adds each day in the future
	// 	for (let c = 0; c < FUTURE_DAYS; c++) {
	// 		let lastDay = this.days[this.days.length - 1];
	// 		let futureDay = new Day();
	// 		futureDay.isEstimation = true;
	// 		lastDay.countries.forEach(country => {
	// 			const {
	// 				cases,
	// 				deaths,
	// 				recovered,
	// 				name,
	// 				population,
	// 				coordinates,
	// 				continent
	// 			} = country;
	// 			const storageDate = dateObjToStorageDate(today);
	// 			const increases = this.calculateIncrease(country.name);
	// 			// console.log("Day:", date, "Country:", country.name, increases);
	// 			futureDay.addData(
	// 				cases + (cases * increases[0]),
	// 				deaths + (deaths * increases[1]),
	// 				recovered + (recovered * increases[2]),
	// 				name,
	// 				storageDate,
	// 				population,
	// 				[coordinates[1], coordinates[0]],
	// 				continent
	// 			);
	// 		});

	// 		this.days.push(futureDay);
	// 		today.setDate(today.getDate() + 1);
	// 	}
	// }

	// calculateIncrease(countryName) {
	// 	const ESTIMATED_INCREASE_DAYS = 3;

	// 	const startIndex = this.days.length - ESTIMATED_INCREASE_DAYS;
	// 	const lastIndex = this.days.length - 1;
	// 	try {
	// 		if (startIndex < 0 || lastIndex < 0) throw "Negative day index";
	// 		let startDay = this.days[startIndex];
	// 		let lastDay = this.days[lastIndex];
	// 		const startCountryIndex = startDay.searchForCountry(countryName);
	// 		const lastCountryIndex = lastDay.searchForCountry(countryName);
	// 		if (startCountryIndex < 0 || lastCountryIndex < 0) throw "Negative country index";
	// 		let startCountry = startDay.countries[startCountryIndex];
	// 		let lastCountry = lastDay.countries[lastCountryIndex];
	// 		// Average increases in cases
	// 		let aiCases = (lastCountry.cases - startCountry.cases) / startCountry.cases / ESTIMATED_INCREASE_DAYS;
	// 		if (isNaN(aiCases)) aiCases = 0;
	// 		let aiDeaths = (lastCountry.deaths - startCountry.deaths) / startCountry.deaths / ESTIMATED_INCREASE_DAYS;
	// 		if (isNaN(aiDeaths)) aiDeaths = 0;
	// 		let aiRecovered = (lastCountry.recovered - startCountry.recovered) / startCountry.recovered / ESTIMATED_INCREASE_DAYS;
	// 		if (isNaN(aiRecovered)) aiRecovered = 0;
	// 		return [aiCases, aiDeaths, aiRecovered];
	// 	}
	// 	catch (e) {
	// 		console.log(e);
	// 		return [0, 0, 0];
	// 	}
	// }

	// Changes country names from downloaded files into ones that are used to store countries
	dictStore(countryName) {
		switch (countryName) {
			case "Mainland China":
				return "China";
			case "US":
				return "United States";
			case "UK":
				return "United Kingdom";
			case "Saint Barthelemy":
				return "France";
			case "occupied Palestinian territory":
			case "Palestine":
				return "Palestinian Territories";
			case "North Macedonia":
				return "Macedonia [FYROM]";
			case "Iran (Islamic Republic of)":
				return "Iran";
			case "Hong Kong SAR":
				return "Hong Kong";
			case "Viet Nam":
				return "Vietnam";
			case "Macao SAR":
				return "Macau";
			case "Russian Federation":
				return "Russia";
			case "Ivory Coast":
			case "Cote d'Ivoire":
				return "Côte dIvoire";
			case "Taiwan*":
				return "Taiwan";
			case "North Ireland":
				return "United Kingdom";
			case "Republic of Ireland":
				return "Ireland";
			case "Holy See":
				return "Vatican City";
			case "Czechia":
				return "Czech Republic";
			case "Reunion":
				return "France";
			case "Republic of Korea":
			case 'Korea South':
				return "South Korea";
			case "St. Martin":
			case "Saint Martin":
				return "France";
			case "Republic of Moldova":
				return "Moldova";
			case "Taipei and environs":
				return "Taiwan";
			case "Channel Islands":
				return "United Kingdom";
			case "Congo (Kinshasa)":
				return "Congo [DRC]";
			case 'Gambia':
			case 'Gambia The':
				return 'The Gambia';
			case 'Bahamas':
			case 'Bahamas The':
				return 'The Bahamas';
			case 'Sao Tome and Principe':
				return '';
			case 'MS Zaandam':
				return 'United States';
			case 'Cruise Ship':
			case 'Diamond Princess':
			case 'Others':
				return 'Japan';
			default:
				return countryName;
		}
	}

	// Changes country names from the ones stored to lookup data in the Rest countries API
	dictRest(name) {
		switch (name) {
			case "Ireland":
				return "IE";
			case "Macedonia [FYROM]":
				return "MK";
			case "Vatican City":
				return "Vatican";
			case "Eswatini":
				return "SZ";
			case "Côte dIvoire":
				return "Ivory Coast";
			case "Congo [DRC]":
				return "DRC";
			case "Congo (Brazzaville)":
				return "Congo-Brazzaville";
			case "Kosovo":
				return "Republic of Kosovo";
			case "Palestinian Territories":
			case "West Bank and Gaza":
				return "Palestine";
			case "Cabo Verde":
				return "Cape Verde";
			case "Timor-Leste":
				return "East Timor";
			default:
				return name;
		}
	}
}

module.exports = Timeline;
