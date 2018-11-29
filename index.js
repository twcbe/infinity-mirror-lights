const app =  require('./app.js');
const http = require('http').Server(app);

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {console.log(`Listening on port ${PORT}`);});
