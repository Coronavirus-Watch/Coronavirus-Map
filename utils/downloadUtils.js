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
			method: "post",
			url: "https://countries-274616.ew.r.appspot.com/",
			data: {
				query: `
				query {
					Country {
					name
					nativeName
					population
					location {
					  latitude
					  longitude
					}
					subregion {
					  region {
						name
					  }
					}
					flag {
					  emoji
					  emojiUnicode
					  svgFile
					}
					alternativeSpellings {
					  name
					}
				  }
				}
				`
			},
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(async response => response.data.data.Country)
			// .then(async response => console.log(response.data))
			.catch(error => console.error(`Error: Couldn't download world country details \n ${error}`));
	}
};