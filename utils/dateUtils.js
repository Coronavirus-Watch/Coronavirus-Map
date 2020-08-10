module.exports = {
    // Converts a JavaScript date object to a download date used for filenames in the COVID-19 repository
    dateObjToDownloadDate(dateObj) {
        if (typeof dateObj != "object") return;
        
        const day = ('0' + dateObj.getDate()).slice(-2);
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const year = dateObj.getFullYear();
        return month + '-' + day + '-' + year;
    },

    // Returns the date formatted as used in the url for files
    dateObjToStorageDate(dateObj) {
        if (typeof dateObj != "object") return;

        const day = ("0" + dateObj.getDate()).slice(-2);
        const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
        const year = dateObj.getFullYear();
        return day + "/" + month + "/" + year;
    },

    // Converts a download date used for filenames in the COVID-19 repository to a storage date used to store days in the timeline
    downloadDateToStorageDate(downloadDate) {
        if (downloadDate == null) return;

        // Removes extension if necessary
        if (downloadDate.endsWith(".csv")) downloadDate.replace(".csv", "");

        // Parses all date sections
        const sections = downloadDate.split("-");
        const day = sections[1];
        const month = sections[0];
        const year = sections[2];
        return day + "/" + month + "/" + year;
    },

    downloadDateToDateObj(downloadDate) {
        if (downloadDate == null) return;

        // Removes extension if necessary
        if (downloadDate.endsWith(".csv")) downloadDate.replace(".csv", "");

        // Parses all date sections
        const sections = downloadDate.split("-");
        const day = sections[1];
        const month = sections[0];
        const year = sections[2];
        return new Date(year, month, day);
    }
}