const axios = require('axios');

module.exports = {
	// requests file content using link parameter
	async requestFile(path) {
		if (typeof path !== 'string') return;

		// Sends an HTTP request to "path" and returns text content
		let fileContents = await axios({
			url: path,
			responseType: 'blob',
			method: 'get'
		})
			.then(async response => response.data)
			.catch(error => console.error(`Error: Failed to download file from url ${path}`));

		// returns data fetched from source
		return fileContents;
	},

	async fetchCountryDetails() {
		return axios({
			method: "GET",
			url: "https://restcountries-v1.p.rapidapi.com/all",
			headers: {
				"content-type": "application/octet-stream",
				"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
				"x-rapidapi-key": "42752e8809msh0edf75d88c1b7e7p177e3djsn05d91367a12a"
			}
		})
			.then(async response => response.data)
			.catch(error => console.error(`Error: Couldn't download world country details \n ${error}`));
	}
};