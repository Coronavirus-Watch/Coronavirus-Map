/*
	This is designed to download and eventually update the coronavirus dataset
	Eventually this would be run by the server periodically as the WHO updates the dataset
	Data source: https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports
 */

/*
	Required Imports
 */

// Imports npm modules
const express = require('express');
const path = require('path');
const schedule = require('node-schedule');

// Imports our external modules
const { dateObjToDownloadDate } = require(path.join(__dirname, 'utils/dateUtils'));
const { requestFile } = require(path.join(__dirname, 'utils/downloadUtils'));
const { importFile, exportCsv, exportJson, exportCountryCsv } = require(path.join(__dirname, 'utils/fileUtils'));
const Timeline = require(path.join(__dirname, 'components/Timeline'));

/*
	User constants
 */
const verbose = true;
const version = "2.0.0";
// Link to source data
const source = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports';
// Path to store the parsed and exported JSON
const exportPath = path.join(__dirname, `data`);
const port = process.env.PORT || 3000;

/*
	Main code
 */

const timeline = new Timeline();

// Updates and formats coronavirus dataset every day at 06:00
schedule.scheduleJob('* 6 * * *', (date) => sync());

// Runs initial Sync
sync();

// Updates and formats coronavirus dataset
async function sync() {
    console.log(`Coronavirus Map Server Version: ${version}\n`);
    // downloads files from source
    let files = await download();
    // parses downloaded files into JSON
    const days = await timeline.init(files);
    // exports parsed data to json file
    exportJson(days, path.join(exportPath, `timeline.json`));
    // exports parsed data to csv file
    exportCsv(days, path.join(exportPath, `timeline.csv`));
    // exports parsed data to countries csv file
    // exportCountryCsv(days, path.join(exportPath, `countries.csv`));
}

// Downloads files from source and returns a data structure containing
// all files' content
async function download() {
    console.log("Downloading Files");
    // initialises files data structure
    let files = [];
    // Sets the first file to look at
    let date = new Date('2020-01-22');
    date.setHours(6, 0, 0, 0)

    // // Calculates millisecond date for today to compare against other dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // For testing purposes - replaces two lines above
    // const yesterday = new Date('2020-01-24');

    // Runs though all the files until yesterday's file is reached
    while (date.valueOf() < yesterday.valueOf()) {
        // Returns the date formatted as used in the url for files
        const formatted = dateObjToDownloadDate(date);
        const filePath = source + '/' + formatted + '.csv';

        // Downloads the file content
        const fileData = await requestFile(filePath);
        if (typeof fileData !== 'undefined') {
            if (verbose) console.log(`File Downloaded: ${formatted}.csv`);
            // Pushes content and path to data structure
            files.push([formatted, fileData]);
        }
        // Increments to next day
        date.setDate(date.getDate() + 1);
    }

    // returns resulting file data structure
    return files;
}

/*
*	API Endpoints
*/

// Setting up Express Server
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log(`Express server is running on port ${port}\n`));

// Serves index.html
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, `public\\index.html`))
});

// API Endpoint for certain Day in Timeline
app.get('/day/:day', async (req, res) =>
    res.send(await timeline.retrieveDay(req.params.day))
);

// API Endpoint for range in Timeline
app.get('/range', async (req, res) =>
    res.send({ range: timeline.days.length })
);

// API Endpoint for country statistics
app.get('/country/:country', async (req, res) => {
    let countryTimeline = [];
    timeline.days.forEach(day => {
        let exists = day.countries.findIndex(country => {
            if (
                country.name.toLowerCase() === req.params.country.toLowerCase()
            ) {
                return country;
            }

            let altSpellings = [];
            for (let i = 0; i < country.altSpellings.length; i++) {
                if (
                    country.altSpellings[i].toLowerCase() ===
                    req.params.country.toLowerCase()
                ) {
                    altSpellings.push(i);
                }
            }
            if (altSpellings.length > 0) {
                return country;
            }
        });

        if (exists > -1) {
            countryTimeline.push([day.countries[exists], day.date]);
        }
    });
    res.send({ timeline: countryTimeline, search: req.params.country });
});

app.get('/alldays', async (req, res) =>
    res.send({ theTimeline: timeline.days })
);

// Serves other files
app.get('/*', async (req, res) => {
    const filename = req.params[0];
    res.sendFile(path.join(__dirname, `public\\${filename}`))
});