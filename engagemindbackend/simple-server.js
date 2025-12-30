const express = require('express');
const app = express();

app.use(express.json());

app.post('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Test route works!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});