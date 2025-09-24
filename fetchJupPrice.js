// fetchJupPrice.js
const fs = require('fs');
const path = require('path');

const API_URL = 'https://lite-api.jup.ag/price/v3?ids=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const CSV_FILE = path.resolve(__dirname, 'prices.csv');

async function getPrice() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const obj = data['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'];
  if (!obj || typeof obj.usdPrice !== 'number') throw new Error('Price missing in response');
  return obj.usdPrice;
}

function ensureCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'timestamp,price\n', 'utf8');
  }
}

function loadRows() {
  ensureCSV();
  const text = fs.readFileSync(CSV_FILE, 'utf8').trim();
  return text.length ? text.split('\n') : ['timestamp,price'];
}

function saveRows(rows) {
  fs.writeFileSync(CSV_FILE, rows.join('\n') + '\n', 'utf8');
}

// retry wrapper with specific delays
async function getPriceWithRetry() {
  const delays = [3000, 5000, 10000]; // ms
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await getPrice();
    } catch (err) {
      if (i < delays.length) {
        console.error(`Attempt ${i + 1} failed: ${err.message || err}. Retrying in ${delays[i] / 1000}s...`);
        await new Promise(r => setTimeout(r, delays[i]));
      } else {
        throw err; // stop after final failure
      }
    }
  }
}

(async function main() {
  try {
    const price = await getPriceWithRetry();
    const iso = new Date().toISOString();

    let rows = loadRows();
    rows.push(`${iso},${price}`);

    // prune rows older than 3 days
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const header = rows[0];
    rows = [header].concat(
      rows
        .slice(1)
        .filter(r => {
          const t = new Date(r.split(',')[0]).getTime();
          return !isNaN(t) && t >= cutoff;
        })
    );

    saveRows(rows);
    console.log(`Saved ${price} at ${iso}`);
  } catch (err) {
    console.error('All attempts failed:', err.message || err);
    process.exit(1);
  }
})();
