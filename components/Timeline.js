/*
	Required Imports
 */
const path = require('path');
const Country = require(path.join(__dirname, 'Country'));
const Day = require(path.join(__dirname, 'Day'));
const { downloadDateToStorageDate, downloadDateToDateObj } = require(path.join(__dirname, '../utils/dateUtils'));
const { fetchCountryDetails } = require(path.join(__dirname, '../utils/downloadUtils'));

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
		this.processFiles(files);
		await this.genGeoJSON();
		return this.days;
	}

	// Loops through each file, creating a new Day instance and extra data parsing
	processFiles(files) {
		files.forEach(async file => {
			this.processDay(file[0], file[1]);
		});
	}

	// Process a file representing the coronavirus statistics by country for that day
	processDay(filename, content) {
		let day = new Day();
		// Prevents commas within quotes from messing up the seperation
		content = this.dealsWithQuoteMarks(content);
		// Seperating each line
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
		console.log(`File Processed: ${filename}`);
		return this.days.push(day);
	}

	extractData(day, filename, regionLine) {
		// Calculates storage date using the downloaded filename
		const storageDate = downloadDateToStorageDate(filename);
		const countryStats = this.getCountryStats(filename, regionLine);
		// Blank entry was detected
		if (countryStats === -1) return
		// Looks up other information from country details array
		const countryDetails = this.searchCountryDetails(countryStats.searchName);
		// 
		this.mergeData(day, storageDate, countryStats, countryDetails);
	}

	getCountryStats(filename, regionLine) {
		// Date where the file format of the downloaded files changes
		const cutOff = new Date(2020, 3, 22);
		// Converts the filename to a JavaScript date object
		const dateObj = downloadDateToDateObj(filename);

		try {
			// Determines which country statistics extractor to use
			if (dateObj < cutOff) return this.getCountryStatsV1(regionLine);
			return this.getCountryStatsV2(regionLine);

		} catch (error) {
			console.error("Invalid Country Statistics Process, likely caused by undefined component or changed file format on server\n");
			console.error(`regionLine: ${regionLine}\n`);
			console.error(error);
		}
	}

	getCountryStatsV1(regionLine) {
		// Extracts cases from the region line
		const cases = regionLine[3].trim();
		// Checks if the entry is blank
		if (cases <= 0) return -1
		// Changes country names from downloaded files into ones that are used to store countries
		const storageName = this.dictStore(regionLine[1].trim());

		const countryStats = {
			cases,
			storageName,
			// Extracts more constants from the region line
			deaths: regionLine[4].trim(),
			recovered: regionLine[5].trim(),
			// Changes country nams from the ones stored to lookup data in the Rest countries API
			searchName: this.dictRest(storageName)
		}
		return countryStats;
	}

	getCountryStatsV2(regionLine) {
		// Extracts cases from the region line
		const cases = regionLine[7].trim();
		// Checks if the entry is blank
		if (cases <= 0) return -1
		// Changes country names from downloaded files into ones that are used to store countries
		const storageName = this.dictStore(regionLine[3].trim());

		const countryStats = {
			cases,
			storageName,
			// Extracts more constants from the region line
			deaths: regionLine[8].trim(),
			recovered: regionLine[9].trim(),
			// Changes country nams from the ones stored to lookup data in the Rest countries API
			searchName: this.dictRest(storageName)
		}
		return countryStats;
	}

	// Extracts data from the line and adds it to the appropriate day
	mergeData(day, storageDate, countryStats, countryDetails) {
		try {
			// Extracts coronavirus information
			const { cases, deaths, recovered, storageName, searchName } = countryStats;

			// Checks for country details lookup error 
			if (typeof countryDetails !== "object") throw "Warning: Failed to find country details for: " + searchName;

			// Extracts country details information
			const { population, latlng, region: continent, altSpellings } = countryDetails;

			// Adds data to the day
			let country = day.addData(cases, deaths, recovered, storageName, storageDate, population, latlng, continent, altSpellings);

			// 
			this.compareData(country);

		} catch (error) {
			// console.log('General Error for: ' + searchName);
			console.error(error);
		}
	}

	// Compares data from yesterdays result with todays to calculate daily changes
	compareData(countryToday) {
		let countryYesterday;
		try {
			const yesterday = this.days[this.days.length - 1];
			countryYesterday = yesterday.countries[yesterday.searchForCountry(countryToday.name)];
		}
		catch {}
		finally {
			if (!countryYesterday) countryYesterday = new Country();
			// Compares data from this day and the previous to calculate increases
			countryToday.comparison(countryYesterday);
		}
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
		try {
			return this.worldDetails.filter(country => {
				if (country.name === name) return true;
				return country.altSpellings.includes(name);
			})[0];
		}
		catch(error) {
			console.error(`Error: Failed to search world country details. This is likely caused by an async/await error`);
			// console.error(error);
		}
	}

	// Gets the highest value of a property in the days array
	getMax(type) {
		if (typeof type !== 'string') return;

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

	// Changes country names from downloaded files into ones that are used to store countries
	dictStore(storageName) {
		switch (storageName) {
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
				return storageName;
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
