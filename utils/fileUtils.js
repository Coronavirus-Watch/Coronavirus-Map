/*
	Required Imports
 */
const fs = require('fs');

module.exports = {
    // Creates a directory if it doesn't exist
    createDirectory(directory) {
        if (typeof directory !== 'string') return; 
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true, encoding: 'utf8'});
    },

    checkPath(path) {
        if (typeof path !== 'string') return;
        const directory = path.slice(0, path.lastIndexOf(`\\`));
        module.exports.createDirectory(directory);
    },

    importFile(path) {
        try {
            const file = fs.readFileSync(path, 'utf8');
            // console.log("File ", path, " imported");
            return file;
        } catch (error) {
            console.error(`Error: Failed to import file: ${path}\n`);
            console.log(error);
        }
    },

    exportFile(content, path) {
        try {
            module.exports.checkPath(path);
            fs.writeFileSync(path, content, 'utf8');
            // console.log(`Exported to ${path}`);
        } catch (error) {
            console.error(error);
        }
    },

    // exports JSON to path given
    exportJson(days, path) {
        if (typeof days !== 'object' || typeof path !== 'string') return;
        let json = [];

        // Loops through each day, appending to the JSON object
        days.forEach(element => {
            json[json.length] = JSON.stringify(element);
        });

        let output = JSON.stringify(days, null, 4);
        module.exports.exportFile(output, path);
    },

    // exports CSV to path given
    exportCsv(days, path) {
        if (typeof days !== 'object' || typeof path !== 'string') return;
        let output = '';

        // Loops through each day, appending to the output variable
        days.forEach(day => {
            day.countries.forEach(country => {
                output += `${country.name}, ${country.cases}, ${country.deaths}, ${country.recovered}, ${country.population}, ${country.continent}, ${day.date}\n`;
            });
        });

        module.exports.exportFile(output, path);
    },

    // exports CSV to path given
    exportCountryCsv(days, path) {
        // initialises CSV string
        const {countries} = days[days.length - 1];

        // creates output string with formatted attributes
        const output = `${countries.name}, ${countries.population}, ${countries.continent}\n`;

        module.exports.exportFile(output,path);
    }
};