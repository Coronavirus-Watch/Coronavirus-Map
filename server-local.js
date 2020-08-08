const port = 3000;

// Setting up Express Server
const app = require('./express/server');

app.listen(port, () => console.log(`Express server is running on port ${port}\n`));