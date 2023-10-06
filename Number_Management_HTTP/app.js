const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8008;

app.use(express.json());

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 5000;

app.get('/numbers', async (req, res) => {
  const urls = req.query.url;

  if (!urls) {
    return res.status(400).json({ error: 'No URLs provided' });
  }

  const uniqueNumbers = new Set();

  try {
    const urlPromises = urls.map(async (url) => {
      let retries = 0;
      let success = false;

      while (retries < MAX_RETRIES && !success) {
        try {
          const response = await axios.get(url, { timeout: REQUEST_TIMEOUT });
          if (response.status === 200 && response.data.numbers) {
            response.data.numbers.forEach((number) => {
              uniqueNumbers.add(number);
            });
            success = true;
          } else {
            console.error(`Unexpected response from ${url}: ${response.status}`);
          }
        } catch (error) {
          console.error(`Error fetching data from ${url} (Attempt ${retries + 1}): ${error.message}`);
        }

        retries++;
      }

      if (!success) {
        console.error(`Max retries reached for ${url}. Skipping.`);
      }
    });

    await Promise.all(urlPromises); 
  } catch (error) {
    console.error('Error fetching data from one or more URLs:', error.message);
  }

  const sortedNumbers = [...uniqueNumbers].sort((a, b) => a - b);

  res.json({ numbers: sortedNumbers });
});

app.listen(PORT, () => {
  console.log(`Number Management Service is running on port ${PORT}`);
});
