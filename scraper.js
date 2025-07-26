// Basic web scraper using axios and cheerio
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePage(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $('title').text();
    console.log('Page Title:', title);
    // Add more scraping logic here as needed
  } catch (error) {
    console.error('Error fetching the page:', error.message);
  }
}

// Example usage:
const url = 'https://example.com';
scrapePage(url); 