require('dotenv').config();
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

const GH_TOKEN = process.env.GH_TOKEN;
const GH_USERNAME = process.env.GH_USERNAME;

if (!GH_USERNAME) {
  console.error("Error: GH_USERNAME environment variable is required.");
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github.v3+json',
};

if (GH_TOKEN) {
  headers.Authorization = `token ${GH_TOKEN}`;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllPages(url) {
  let allData = [];
  let page = 1;
  while (true) {
    try {
      const separator = url.includes('?') ? '&' : '?';
      const pagedUrl = `${url}${separator}page=${page}&per_page=100`;
      console.log(`Fetching: ${pagedUrl}`);
      const response = await axios.get(pagedUrl, { headers });
      allData = allData.concat(response.data);
      
      if (response.data.length < 100) {
        break;
      }
      page++;
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
        const resetTime = new Date(Number(error.response.headers['x-ratelimit-reset']) * 1000);
        console.error(`Rate limit exceeded! Resets at ${resetTime}`);
        process.exit(1);
      }
      console.error(`Error fetching ${url}:`, error.message);
      break;
    }
    await sleep(100); // Small delay to be polite
  }
  return allData;
}

async function run() {
  console.log(`Starting aggregation for user: ${GH_USERNAME}`);
  
  // 1. Fetch all public repos for the user
  const reposUrl = `https://api.github.com/users/${GH_USERNAME}/repos?type=owner`;
  const repos = await fetchAllPages(reposUrl);
  
  console.log(`Found ${repos.length} public repositories.`);
  
  const contributorsMap = {};

  // 2. Fetch contributors for each repo
  for (const repo of repos) {
    // Skip forked repos — their contributors belong to the upstream org, not us
    if (repo.fork) continue;

    const contributorsUrl = `https://api.github.com/repos/${GH_USERNAME}/${repo.name}/contributors`;
    const repoContributors = await fetchAllPages(contributorsUrl);
    
    for (const user of repoContributors) {
      if (!user || !user.login) continue;
      
      const login = user.login.toLowerCase();
      
      // Filter out the owner and bots
      if (login === GH_USERNAME.toLowerCase()) continue;
      if (user.type !== 'User') continue;
      if (login.includes('bot')) continue;
      
      if (!contributorsMap[login]) {
        contributorsMap[login] = {
          username: user.login,
          contributions: 0,
          avatar: user.avatar_url
        };
      }
      
      contributorsMap[login].contributions += user.contributions;
    }
  }
  
  // 3. Sort contributors by total contributions descending
  const sortedContributors = Object.values(contributorsMap).sort((a, b) => b.contributions - a.contributions);
  
  console.log(`Aggregated ${sortedContributors.length} unique contributors.`);
  
  // 4. Save result to data/contributors.json
  const dataDir = path.join(__dirname, '..', 'data');
  await fs.mkdir(dataDir, { recursive: true });
  
  const outputPath = path.join(dataDir, `contributors.json`);
  await fs.writeFile(outputPath, JSON.stringify(sortedContributors, null, 2), 'utf-8');
  
  console.log(`Successfully saved aggregated data to ${outputPath}`);
}

run().catch(err => {
  console.error("Fatal error during aggregation:", err);
  process.exit(1);
});
