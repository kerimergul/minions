const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Statik dosyaları (örneğin index.html) sunucuya dahil etmek için
app.use(express.static(path.join(__dirname, '')));

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});