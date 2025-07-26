const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// Helper to extract meta tags
function extractLinkedInJobs($) {
  const jobs = [];
  // Try to select any <li> or <div> that looks like a job card
  $('li, div').each((_, el) => {
    const title = $(el).find('h3, .job-card-list__title, .base-search-card__title, [data-test-job-title]').text().trim();
    const company = $(el).find('.base-search-card__subtitle, .job-card-container__company-name, .job-card-list__company-name, [data-test-job-company-name]').text().trim();
    const location = $(el).find('.job-search-card__location, .job-card-container__metadata-item, [data-test-job-location]').text().trim();
    const link = $(el).find('a').attr('href');
    const description = $(el).find('.job-card-container__description, .job-card-list__description, [data-test-job-description]').text().trim() || '';
    if (title && company && link) jobs.push({ title, company, location, link, description });
  });
  return jobs;
}

function extractUnstopJobs($) {
  const jobs = [];
  $('div, li').each((_, el) => {
    const title = $(el).find('.job-title, [data-test-job-title]').text().trim();
    const company = $(el).find('.company-name, [data-test-job-company-name]').text().trim();
    const location = $(el).find('.location, [data-test-job-location]').text().trim();
    const link = $(el).find('a').attr('href');
    const description = $(el).find('.job-description, [data-test-job-description]').text().trim() || '';
    if (title && company && link) jobs.push({ title, company, location, link, description });
  });
  return jobs;
}

// Helper to extract jobs from Unstop
function extractUnstopJobs($) {
  const jobs = [];
  $('.job-card, ._job-card_1h9ks_1').each((_, el) => {
    const title = $(el).find('.job-title, ._job-title_1h9ks_10').text().trim();
    const company = $(el).find('.company-name, ._company-name_1h9ks_14').text().trim();
    const location = $(el).find('.location, ._location_1h9ks_18').text().trim();
    const link = $(el).find('a').attr('href');
    const description = $(el).find('.job-description, ._job-description_1h9ks_22').text().trim() || '';
    if (title) jobs.push({ title, company, location, link, description });
  });
  return jobs;
}

// Helper to build search URLs
function buildLinkedInUrl(keywords) {
  const query = encodeURIComponent(keywords.join(' '));
  return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
}
function buildUnstopUrl(keywords) {
  const query = encodeURIComponent(keywords.join(' '));
  return `https://unstop.com/jobs?search=${query}`;
}

// Main POST /scraper
router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraperBot/1.0)'
      }
    });
    const $ = cheerio.load(data);
    const meta = extractMeta($);
    let jobs = [];
    if (url.includes('linkedin.com')) {
      jobs = extractLinkedInJobs($);
    } else if (url.includes('unstop.com')) {
      jobs = extractUnstopJobs($);
    }
    res.json({ meta, jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /find-jobs
// Body: { keywords: ["react", "developer"] }
router.post('/find-jobs', async (req, res) => {
  const { keywords } = req.body;
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'Keywords array is required' });
  }
  const results = [];
  try {
    // LinkedIn
    const linkedinUrl = buildLinkedInUrl(keywords);
    const linkedinResp = await axios.post('http://localhost:3000/scraper', { url: linkedinUrl });
    console.log('LinkedIn URL:', linkedinUrl, 'Jobs found:', linkedinResp.data.jobs?.length);
    if (linkedinResp.data.jobs) {
      results.push(...linkedinResp.data.jobs.map(j => ({ ...j, source: 'LinkedIn' })));
    }
    // Unstop
    const unstopUrl = buildUnstopUrl(keywords);
    const unstopResp = await axios.post('http://localhost:3000/scraper', { url: unstopUrl });
    console.log('Unstop URL:', unstopUrl, 'Jobs found:', unstopResp.data.jobs?.length);
    if (unstopResp.data.jobs) {
      results.push(...unstopResp.data.jobs.map(j => ({ ...j, source: 'Unstop' })));
    }
    res.json({ jobs: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 