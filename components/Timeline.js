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
		// console.log(this.worldDetails);
		if (!this.worldDetails) throw "Error: Failed to store country details"
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
			// Changes country nams from the ones stored to lookup data in the GraphQL countries API
			searchName: this.dictApi(storageName)
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
			searchName: this.dictApi(storageName)
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
			const { population, location } = countryDetails;
			const continent = countryDetails.subregion.region.name;
			const altSpellings = countryDetails.alternativeSpellings.name;

			// Adds data to the day
			let country = day.addData(cases, deaths, recovered, storageName, storageDate, population, location, continent, altSpellings);

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
		catch { }
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
				if (country.nativeName === name) return true;
				return country.alternativeSpellings.filter(alt => {
					if (alt.name === name) return true;
				})[0];
			})[0];
		}
		catch (error) {
			console.error(`Error: Failed to search world country details. This is likely caused by an async/await error`);
			console.error(error);
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
			case 'Korea South':
				return 'South Korea'
			case "North Macedonia":
				return "Republic of Macedonia";
			case "Russian Federation":
				return "Russia";
			case "Cote d'Ivoire":
				return "Côte d'Ivoire";
			case "Taiwan*":
				return "Taiwan";
			case "Congo [DRC]":
			case 'Congo (Kinshasa)':
				return "Democratic Republic of the Congo";
			case "Congo (Brazzaville)":
				return "Republic of the Congo";
			case "Czechia":
				return "Czech Republic";
			case "Eswatini":
				return "Swaziland";
			case "West Bank and Gaza":
				return "Palestine";
			case 'Vatican City':
				return 'Holy See'
			case 'Hong Kong SAR':
				return 'Hong Kong'
			case 'North Ireland':
				return 'United Kingdom'
			case 'Saint Martin':
				return 'St. Martin'
			case 'occupied Palestinian territory':
				return 'Palestine'
			case 'Macao SAR':
				return 'Macao'
			case 'Taipei and environs':
				return 'Taiwan'
			case 'Saint Barthelemy':
				return 'St. Barthelemy'
			case 'Bahamas The':
			case 'The Bahamas':
				return 'Bahamas'
			case 'Gambia The':
			case 'The Gambia':
				return 'Gambia'
			case 'Cape Verde':
				return 'Cabo Verde';
			case 'Channel Islands':
				return 'United Kingdom';
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

	// Changes country names from the ones stored to lookup data in the GraphQL countries API
	dictApi(name) {
		switch (name) {
			case 'St. Martin':
				return 'Saint-Martin'
			case "South Korea":
				return "Republic of Korea"
			case 'Macau':
				return 'Macao'
			case 'Vietnam':
				return 'Viet Nam'
			case 'Palestine':
				return 'State of Palestine'
			case 'Syria':
				return 'Syrian Arab Republic'
			case 'Russia':
				return 'Russian Federation'
			case 'Kosovo':
				return 'Republic of Kosovo'
			case 'Republic of the Congo':
				return 'Congo-Brazzaville'
			case 'Democratic Republic of the Congo':
				return 'Congo-Kinshasa'
			case 'Iran':
				return 'Islamic Republic of Iran'
			case 'Brunei':
				return 'Nation of Brunei'
			default:
				return name;
		}
	}
}

module.exports = Timeline;
