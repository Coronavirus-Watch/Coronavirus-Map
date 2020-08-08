const searchBox = document.querySelector('#search');
const submitBtn = document.querySelector('#submitBtn');

const countryName = document.querySelector('#countryName');
const timelineDiv = document.querySelector('.timeline');
const graphs = document.querySelector('#graphs');

searchBox.value = '';

const urlParams = new URLSearchParams(window.location.search);
let country = urlParams.has('search') ? urlParams.get('search') : undefined;
if (country) {
	fetchCountry(country);
}

async function fetchCountry(search) {
	timelineDiv.innerHTML = '';
	graphs.innerHTML = '';
	const data = await fetch(`/country/${search}`)
		.then(res => res.json())
		.then(res => {
			countryName.innerHTML = res.timeline[0][0].name;
			console.log(res.timeline);
			res.timeline.forEach(function(dayInArr, index, arr) {
				const day = dayInArr[0];
				let dayDiv = document.createElement('DIV');
				if (day.estimatedDay) {
					dayDiv.style.opacity =
						((arr.length - index) / arr.length) * 6;
				}

				const dateOption = {
					month: 'short'
				};

				let dateText = document.createElement('H5');
				let dateArray = res.timeline[index][1].split('/');
				let dateVal = new Date();
				console.log(dateArray);
				dateVal.setDate(dateArray[0]);
				dateVal.setMonth(dateArray[1] - 1);
				let dayVal = dateVal.getDate().toString();
				switch (dayVal.charAt(dayVal.length - 1)) {
					case '1':
						dayVal += 'st';
						break;
					case '2':
						dayVal += 'nd';
						break;
					case '3':
						dayVal += 'rd';
						break;
					default:
						dayVal += 'th';
						break;
				}
				if (dayVal == '11st') {
					dayVal = '11th';
				}

				dateText.innerHTML =
					dayVal +
					' ' +
					dateVal.toLocaleDateString(undefined, dateOption);

				let attributes = document.createElement('UL');
				let dayCases = document.createElement('LI');
				if (index > 0) {
					dayCases.innerHTML = `<span class="cases number">${day.cases.toLocaleString()}</span> <span class="diff">+${(
						day.cases - arr[index - 1][0].cases
					).toLocaleString()}</span>`;
				} else {
					dayCases.innerHTML = `<span class="cases number">${day.cases.toLocaleString()}</span>`;
				}
				let dayDeaths = document.createElement('LI');
				if (index > 0) {
					dayDeaths.innerHTML = `<span class="deaths number">${day.deaths.toLocaleString()}</span> <span class="diff">+${(
						day.deaths - arr[index - 1][0].deaths
					).toLocaleString()}</span>`;
				} else {
					dayDeaths.innerHTML = `<span class="deaths number">${day.deaths.toLocaleString()}</span>`;
				}
				let dayRecovered = document.createElement('LI');
				if (index > 0) {
					dayRecovered.innerHTML = `<span class="recovered number">${day.recovered.toLocaleString()}</span> <span class="diff">+${(
						day.recovered - arr[index - 1][0].recovered
					).toLocaleString()}</span>`;
				} else {
					dayRecovered.innerHTML = `<span class="recovered number">${day.recovered.toLocaleString()}</span>`;
				}

				attributes.appendChild(dayCases);
				attributes.appendChild(dayDeaths);
				attributes.appendChild(dayRecovered);

				dayDiv.appendChild(dateText);
				dayDiv.appendChild(attributes);
				dayDiv.classList.add('day');

				timelineDiv.appendChild(dayDiv);
			});

			searchBox.value = '';
			createGraphs(
				res.timeline,
				'cases,deaths,recovered',
				'orange,coral,lightgreen'
			);
		})
		.catch(e => {
			console.log(e);
			countryName.innerHTML = 'Unable to find country... ';
		});
}

submitBtn.addEventListener('click', searchCountry);

function searchCountry(e) {
	e.preventDefault();

	fetchCountry(searchBox.value);
}

function createGraphs(timeline, propsList, color) {
	let chart = document.createElement('CANVAS');
	chart.setAttribute('id', `propsChart`);
	const labels = timeline.map(el => el[1]);
	let props = propsList.split(',');
	let colors = color.split(',');
	let dataSets = [];
	props.forEach((prop, index) => {
		dataSets.push({
			label: `${prop.charAt(0).toUpperCase() + prop.slice(1)}`,
			data: timeline.map(el => el[0][prop]),
			backgroundColor: [colors[index]],
			borderColor: [colors[index]],
			pointBackgroundColor: colors[index],
			pointBorderColor: colors[index],
			fill: false,
			borderWidth: 3,
			pointRadius: 0
		});
		// dataSets.push({
		// 	label: `# of Estimated ${prop.charAt(0).toUpperCase() + prop.slice(1)}`,
		// 	data: timeline.map(el => {
		// 		if (el[0].estimatedDay) return el[0][prop]
		// 	}),
		// 	backgroundColor: [colors[index]],
		// 	borderColor: [colors[index]],
		// 	pointBackgroundColor: colors[index],
		// 	pointBorderColor: colors[index],
		// 	fill: false,
		// 	borderWidth: 3,
		// 	pointRadius: 0
		// });
	});

	let ctx = chart.getContext('2d');
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: dataSets
		},
		options: {
			responsive: true,
			tooltips: {
				mode: 'nearest',
				intersect: false
			},
			hover: {
				mode: 'nearest',
				intersect: true
			},
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: false,
							display: false
						},
						gridLines: [
							{
								display: false
							}
						]
					}
				],
				xAxes: [
					{
						ticks: {
							display: false
						},
						gridLines: [
							{
								display: false
							}
						]
					}
				]
			}
		}
	});
	graphs.innerHTML = '';
	graphs.appendChild(chart);
}
