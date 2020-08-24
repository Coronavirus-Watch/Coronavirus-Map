const searchBox = document.querySelector('#search');
const submitBtn = document.querySelector('#submitBtn');
const countryName = document.querySelector('#countryName');
const timelineDiv = document.querySelector('.timeline');
const graphs = document.querySelector('#graphs');

const urlParams = new URLSearchParams(window.location.search);

// Gets country name from search box and fetches it
const country = urlParams.has('search') ? urlParams.get('search') : undefined;
if (country) fetchCountry(country);

// Adds event listener
submitBtn.addEventListener('click', searchCountry);

//
function fetchCountry(search) {
    timelineDiv.innerHTML = '';
    graphs.innerHTML = '';
    fetch(`/country/${search}`)
        .then(res => res.json())
        .then(res => {
            // Displays country name
            countryName.innerHTML = res.timeline[0][0].name;
            displayDayBoxes(res);
            searchBox.value = '';
            displayGraphs(res);
        })
        .catch(e => {
            console.log(e);
            countryName.innerHTML = 'Unable to find country... ';
        });
}

function displayDayBoxes(res) {
    res.timeline.forEach((dayInArr, index, arr) => {
        const day = dayInArr[0];
        let dayDiv = document.createElement('div');
        let dateText = document.createElement('h5');
        let dateArray = res.timeline[index][1].split('/');
        // Adds date to the timeline
        dateText.innerHTML = getFormattedDate(dateArray);

        let attributes = document.createElement('ul');
        let dayCases = document.createElement('li');
        let dayDeaths = document.createElement('li');
        let dayRecovered = document.createElement('li');

        if (index > 0) {
            dayCases.innerHTML = `<span class="cases number">${day.cases.toLocaleString()}</span> <span class="diff">+${(
                day.cases - arr[index - 1][0].cases
            ).toLocaleString()}</span>`;
            dayDeaths.innerHTML = `<span class="deaths number">${day.deaths.toLocaleString()}</span> <span class="diff">+${(
                day.deaths - arr[index - 1][0].deaths
            ).toLocaleString()}</span>`;
            dayRecovered.innerHTML = `<span class="recovered number">${day.recovered.toLocaleString()}</span> <span class="diff">+${(
                day.recovered - arr[index - 1][0].recovered
            ).toLocaleString()}</span>`;
        } else {
            dayCases.innerHTML = `<span class="cases number">${day.cases.toLocaleString()}</span>`;
            dayDeaths.innerHTML = `<span class="deaths number">${day.deaths.toLocaleString()}</span>`;
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
}

function displayGraphs(res) {
    createGraphs(
        res.timeline,
        'cases,deaths,recovered',
        'orange,coral,lightgreen'
    );
}

function getFormattedDate(dateArray) {
    const dateOption = {month: 'short'};
    const dateVal = new Date();
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
    }
    if (dayVal == '11st') dayVal = '11th';

    return `${dayVal} ${dateVal.toLocaleDateString(undefined, dateOption)}`;
}

function searchCountry(e) {
    e.preventDefault();
    fetchCountry(searchBox.value);
}

function createGraphs(timeline, propsList, color) {
    const chart = document.createElement('canvas');

    chart.setAttribute('id', `propsChart`);
    const labels = timeline.map(el => el[1]);
    const props = propsList.split(',');
    const colors = color.split(',');
    const dataSets = [];

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
    });

    let ctx = chart.getContext('2d');
    new Chart(ctx, {
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
