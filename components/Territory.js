// const ASSUMED_DEATH_RATE =
// const TRAVEL_RATE = 0.001;
// const DOUBLING_TIME = 6.18;
// const DEATH_TIME = 17.33;

class Territory {
	constructor(cases = 0, deaths = 0, recovered = 0) {
		// Constants used to estimate case numbers
		// Credits to: Tomas Pueyo
		// Source: https://medium.com/@tomaspueyo/coronavirus-act-today-or-people-will-die-f4d3d9cd99ca
		this.ASSUMED_DEATH_RATE = 0.00874;

		//
		this.cases = parseInt(cases);
		this.deaths = parseInt(deaths);
		this.recovered = parseInt(recovered);
		// 
		this.calculate();
	}

	additionalData(cases = 0, deaths = 0, recovered = 0) {
		this.cases = this.cases + parseInt(cases);
		this.deaths = this.deaths + parseInt(deaths);
		this.recovered = this.recovered + parseInt(recovered);
		this.calculate();
	}

	calculate() {
		// Active confirmed cases
		this.active = parseInt((this.cases - this.deaths - this.recovered));
		// Case fatality ratio
		this.cfr = parseFloat((this.deaths / this.cases).toFixed(2));
		// Confirmed cases per 1 million people
		this.cpm = parseFloat(((this.cases / this.population) * 1000000).toFixed(2));
		// Deaths per 1 million people
		this.dpm = parseFloat(((this.deaths / this.population) * 1000000).toFixed(2));
		// Estimated Active Cases
		this.estimated = parseInt(Math.max(
			Math.round((this.cfr / this.ASSUMED_DEATH_RATE) * this.active),
			this.active)
		);
	}

	// Compares data from this day and the previous to calculate increases
	comparison(varsArray) {
		const lastActive = varsArray[0];
		const lastCases = varsArray[1];
		const lastDeaths = varsArray[2];
		const lastRecovered = varsArray[3];
		// Daily Increase in Active Cases
		this.dia = ((this.active - lastActive) / lastActive) * 100;
		// Daily Increase in Confirmed Cases
		this.dicc = ((this.cases - lastCases) / lastCases) * 100;
		// Daily Increase in Deaths
		this.did = ((this.deaths - lastDeaths) / lastDeaths) * 100;
		// Daily Increase in Recovered
		this.dir = ((this.recovered - lastRecovered) / lastRecovered) * 100;
	}

	getVarsArray() {
		return [this.active, this.cases, this.deaths, this.recovered];
	}

	print() {
		console.log(
			'Cases:',
			this.cases,
			'\t',
			'Deaths:',
			this.deaths,
			'\t',
			'Recovered:',
			this.recovered,
			'Population:',
			this.population
		);
	}
}

module.exports = Territory;
