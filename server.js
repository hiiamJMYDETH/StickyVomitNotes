const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'docs')));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});