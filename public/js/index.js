/* Useful resources:
  https://dev.to/wuz/building-a-country-highlighting-tool-with-mapbox-2kbh
  https://bl.ocks.org/danswick/fc56f37c10d40be62e4feac5984250d2
*/

// Access Token for mapbox
mapboxgl.accessToken =
	'pk.eyJ1IjoibWF4d2lsbGtlbGx5IiwiYSI6ImNrNjhsOWdlZTA0M2Yza21mMG9icjBwdmIifQ.OTaUkNePX-6XE3Vgcy9v6A';
let map = new mapboxgl.Map({
	container: 'map',
	// Sets the map style
	style: 'mapbox://styles/maxwillkelly/ck74w75df0dtf1imcwnew4m6b',
	// Displays the world
	zoom: 2,
	center: [15, 50]
});

// GUI elements
const markersCheck = document.querySelector('#markers');
const radioBtns = document.querySelectorAll('input[type=radio]');
const dateSlider = document.getElementById('dateSlider');
const controller = document.querySelector('.controller');
const dateDisplayed = document.getElementById('dateDisplayed');
dateSlider.max = 100;
dateSlider.value = 0;

// sets default visibility of layers
let toggledLayers = {
	routesVisible: false,
	markersVisible: false,
	checkedRadio: 'cases'
};

let currentDay = {};

// Adds EventListeners to checkboxes for when their checked value changes
markersCheck.addEventListener('change', e => {
	toggledLayers.markersVisible = e.target.checked;
	updateMap(toggledLayers);
});

radioBtns.forEach(btn => {
	btn.addEventListener('change', e => {
		toggledLayers.checkedRadio = e.target.value;
		updateMap(toggledLayers);
	});
});

// when map first loads on webpage
map.on('load', async () => {
	fetchRange();
	await fetchDay(0);
	// Adds routes to layers
	addLayers();
	// displays map
	displayMap(toggledLayers);
	// updates the map with defaults
	updateMap(toggledLayers);
	controller.style.display = 'block';
});
// stores popups
let popups = [];
function addPopup(e) {
	const popup = new mapboxgl.Popup({ closeOnMove: true })
		.setLngLat(e.lngLat)
		.setHTML(
			`
			<h6><a href="/country.html?search=${e.features[0].properties.title}">${e.features[0].properties.title}</a></h6>
			<p>Cases: <strong>${e.features[0].properties.cases}</strong></p>
			<p>Deaths: <strong>${e.features[0].properties.deaths}</strong></p>
			<p>Recovered: <strong>${e.features[0].properties.recovered}</strong></p>
	`
		)
		.addTo(map);
	popups.push(popup);
}

map.on('click', 'cases-labels', addPopup);
map.on('click', 'deaths-labels', addPopup);
map.on('click', 'recovered-labels', addPopup);

map.on('update', e => {
	// closes all popups that are open when update
	popups.forEach(popup => {
		popup.remove();
	});
	popups = [];
});

function mapMouseEnter() {
	map.getCanvas().style.cursor = 'pointer';
}
function mapMouseLeave() {
	map.getCanvas().style.cursor = '';
}

// Event Listeners on hover of circles
map.on('mouseenter', 'cases-labels', mapMouseEnter);
map.on('mouseleave', 'cases-labels', mapMouseLeave);
map.on('mouseenter', 'deaths-labels', mapMouseEnter);
map.on('mouseleave', 'deaths-labels', mapMouseLeave);
map.on('mouseenter', 'recovered-labels', mapMouseEnter);
map.on('mouseleave', 'recovered-labels', mapMouseLeave);

function setMax(newMax) {
	document.querySelector('#dateSlider').max = newMax.range - 1;
}

async function fetchDay(day) {
	// fetches timeline
	await fetch(`/day/${day}`)
		.then(res => {
			return res.json();
		})
		.then(res => {
			currentDay = res;
		})
		.catch(res => {
			console.error(`Failed to retrieve statistics for day ${day}`);
			console.error(`Returned: ${res}`);
		});
}

async function fetchRange() {
	await fetch('/range')
		.then(res => {
			return res.json();
		})
		.then(setMax);
}

// Adds Layers to Map
function addLayers() {
	map.addSource('timeline', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: currentDay
		}
	});

	// Defines new layers for map

	map.addLayer({
		id: 'cases-circles',
		type: 'circle',
		source: 'timeline',
		paint: {
			'circle-radius': ['*', ['log10', ['number', ['get', 'cases']]], 10],
			'circle-opacity': 0.4,
			'circle-color': 'orange'
		}
	});

	map.addLayer({
		id: 'deaths-circles',
		type: 'circle',
		source: 'timeline',
		paint: {
			'circle-radius': [
				'*',
				['log10', ['number', ['get', 'deaths']]],
				10
			],
			'circle-opacity': 0.4,
			'circle-color': 'red'
		}
	});

	map.addLayer({
		id: 'recovered-circles',
		type: 'circle',
		source: 'timeline',
		paint: {
			'circle-radius': [
				'*',
				['log10', ['number', ['get', 'recovered']]],
				10
			],
			'circle-opacity': 0.4,
			'circle-color': 'green'
		}
	});

	// Will only display labels if the value of statistic is greater than 0
	map.addLayer({
		id: 'recovered-labels',
		type: 'symbol',
		source: 'timeline',
		paint: {
			'text-color': 'white'
		},
		layout: {
			'text-field': [
				'concat',
				['get', 'title'],
				' [',
				['to-string', ['get', 'recovered']],
				'] '
			],
			'text-size': ['case', ['>', ['get', 'recovered'], 0], 12, 0],
			'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
		}
	});
	map.addLayer({
		id: 'cases-labels',
		type: 'symbol',
		source: 'timeline',
		paint: {
			'text-color': 'white'
		},
		layout: {
			'text-field': [
				'concat',
				['get', 'title'],
				' [',
				['to-string', ['get', 'cases']],
				'] '
			],
			'text-size': ['case', ['>', ['get', 'cases'], 0], 12, 0],
			'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
		}
	});
	map.addLayer({
		id: 'deaths-labels',
		type: 'symbol',
		source: 'timeline',
		paint: {
			'text-color': 'white'
		},
		layout: {
			'text-field': [
				'concat',
				['get', 'title'],
				' [',
				['to-string', ['get', 'deaths']],
				'] '
			],
			'text-size': ['case', ['>', ['get', 'deaths'], 0], 12, 0],
			'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
		}
	});
}

// Displays the map
function displayMap() {
	// Adds full screen control
	map.addControl(new mapboxgl.FullscreenControl());
	// Prevents map from looking stupid
	map.resize();
}

// Play function for automatically sliding dateSlider
function play() {
	// const max = timeline.getMax();
	dateSlider.stepUp();
	dateSlider.dispatchEvent(new Event('input'));
}

// Updates the map with the correct visible layers
function updateMap(toggledLayers) {
	if (toggledLayers.markersVisible == true) {
		map.setLayoutProperty('cases-labels', 'text-field', [
			'concat',
			['get', 'title'],
			' [',
			['to-string', ['get', 'cases']],
			']'
		]);
		map.setLayoutProperty('deaths-labels', 'text-field', [
			'concat',
			['get', 'title'],
			' [',
			['to-string', ['get', 'deaths']],
			']'
		]);
		map.setLayoutProperty('recovered-labels', 'text-field', [
			'concat',
			['get', 'title'],
			' [',
			['to-string', ['get', 'recovered']],
			']'
		]);
	} else {
		map.setLayoutProperty('cases-labels', 'text-field', [
			'to-string',
			['get', 'cases']
		]);
		map.setLayoutProperty('deaths-labels', 'text-field', [
			'to-string',
			['get', 'deaths']
		]);
		map.setLayoutProperty('recovered-labels', 'text-field', [
			'to-string',
			['get', 'recovered']
		]);
	}

	// updates layout properties depending on the checked radio
	switch (toggledLayers.checkedRadio) {
		case 'cases':
			map.setLayoutProperty('cases-labels', 'visibility', 'visible');
			map.setLayoutProperty('cases-circles', 'visibility', 'visible');
			map.setLayoutProperty('deaths-labels', 'visibility', 'none');
			map.setLayoutProperty('deaths-circles', 'visibility', 'none');
			map.setLayoutProperty('recovered-labels', 'visibility', 'none');
			map.setLayoutProperty('recovered-circles', 'visibility', 'none');
			break;
		case 'deaths':
			map.setLayoutProperty('cases-labels', 'visibility', 'none');
			map.setLayoutProperty('cases-circles', 'visibility', 'none');
			map.setLayoutProperty('deaths-labels', 'visibility', 'visible');
			map.setLayoutProperty('deaths-circles', 'visibility', 'visible');
			map.setLayoutProperty('recovered-labels', 'visibility', 'none');
			map.setLayoutProperty('recovered-circles', 'visibility', 'none');
			break;
		case 'recovered':
			map.setLayoutProperty('cases-labels', 'visibility', 'none');
			map.setLayoutProperty('cases-circles', 'visibility', 'none');
			map.setLayoutProperty('deaths-labels', 'visibility', 'none');
			map.setLayoutProperty('deaths-circles', 'visibility', 'none');
			map.setLayoutProperty('recovered-labels', 'visibility', 'visible');
			map.setLayoutProperty('recovered-circles', 'visibility', 'visible');
	}
	map.fire('update');
}

// Creates event listener for dateSlider on whenever value is changed
dateSlider.addEventListener('input', async function (e) {
	let date = new Date(2020, 0, 22);
	var day = 60 * 60 * 24 * 1000;

	// updates GUI date, showing the current day
	date = new Date(date.getTime() + this.value * day);
	dateDisplayed.innerHTML = formatDate(date);

	// const currentDay = await fetchDay(e.target.value);
	await fetchDay(e.target.value);

	map.fire('update');

	// updates the geoJSON for the selected day in slider
	map.getSource('timeline').setData({
		type: 'FeatureCollection',
		features: currentDay
	});

	// update map accordingly
	updateMap(toggledLayers);
});

// Returns the date formatted as used in the url for files
function formatDate(date) {
	const day = ('0' + String(date.getDate())).slice(-2);
	const month = ('0' + String(date.getMonth() + 1)).slice(-2);
	const year = String(date.getFullYear());
	const dateVar = 'Date: ' + day + '/' + month + '/' + year;
	return dateVar;
}
