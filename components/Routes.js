const Route = require('./Route');

class Routes {
	constructor() {
		this.routes = [];
		this.geojson = [];
	}

	async init(countries) {
		await this.fetchRoutes(countries);
	}

	// fetches routes from text file
	async fetchRoutes(countries) {
		// retrieves text data from file
		const res = await fetch('../data/parsedDomesticsOutput.txt');
		// parses the response data into plain text
		const text = await res.text();
		// parses the data into a routes Object
		const routes = await this.parseRoutes(countries, text);
		// returns Object of all routes
		this.routes = routes;
	}

	// Parses the routes text data
	async parseRoutes(countries, text) {
		// splits text up into lines in the file
		const lines = text.split('\n');

		// goes through each route in the file
		for (let i = 0; i < lines.length; i++) {
			// splits each route into a "journey"
			const journey = lines[i].split(',');
			if (
				countries[journey[3]] !== undefined &&
				countries[journey[1]] !== undefined
			) {
				const fromCoord = [
					parseFloat(countries[journey[1]].coordinates[0]),
					parseFloat(countries[journey[1]].coordinates[1])
				];
				const toCoord = [
					parseFloat(countries[journey[3]].coordinates[0]),
					parseFloat(countries[journey[3]].coordinates[1])
				];

				const origin = {
					name: journey[1].trim(),
					coordinates: fromCoord
				};
				const destination = {
					name: journey[3].trim(),
					coordinates: toCoord
				};
				const newRoute = new Route(origin, destination);
				this.routes.push(newRoute);
			}
		}
		return this.routes;
	}

	parseGeoJSON() {
		let tempArray = [];
		this.routes.forEach(route => {
			tempArray.push({
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [
						route.origin.coordinates,
						route.destination.coordinates
					]
				}
			});
		});
		this.geojson = tempArray;
	}
}
