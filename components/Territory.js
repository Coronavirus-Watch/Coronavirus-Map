class Territory {
	constructor(cases = 0, deaths = 0, recovered = 0) {
		this.cases = parseInt(cases);
		this.deaths = parseInt(deaths);
		this.recovered = parseInt(recovered);
		this.calculate();
	}

	additionalData(cases = 0, deaths = 0, recovered = 0) {
		this.cases += parseInt(cases);
		this.deaths += parseInt(deaths);
		this.recovered += parseInt(recovered);
		this.calculate();
	}

	calculate() {
		// Case fatality ratio
		this.caseFatailyRatio = parseFloat((this.deaths / this.cases).toFixed(2));
		// Confirmed cases per 1 million people
		this.casesPerMillion = parseFloat(((this.cases / this.population) * 1000000).toFixed(2));
		// Deaths per 1 million people
		this.deathsPerMillion = parseFloat(((this.deaths / this.population) * 1000000).toFixed(2));
	}

	// Compares data from this day and the previous day to calculate increases
	comparison(territoryYesterday) {
		// Daily Change in Confirmed Cases
		this.dailyChangeCases = this.cases - territoryYesterday.cases;
		// Daily Change in Deaths
		this.dailyChangeDeaths = this.deaths - territoryYesterday.deaths;
		// Daily Change in Recovered
		this.dailyChangeRecovered = this.recovered - territoryYesterday.recovered;

		// Daily Percentage Change in Confirmed Cases
		this.dailyPercChangeCases = parseFloat(((this.dailyChangeCases / territoryYesterday.cases) * 100).toFixed(2));
		// Daily Percentage Change in Deaths
		this.dailyPercChangeDeaths = parseFloat(((this.dailyChangeDeaths / territoryYesterday.deaths) * 100).toFixed(2));
		// Daily Percentage Change in Recovered
		this.dailyPercChangeRecovered = parseFloat(((this.dailyChangeRecovered / territoryYesterday.recovered) * 100).toFixed(2));
	}

	print() {
		console.log(`Cases: ${this.cases}\t Deaths: ${this.deaths}\t Recovered: ${this.recovered}\t Population: ${this.population}`);
	}
}

module.exports = Territory;
