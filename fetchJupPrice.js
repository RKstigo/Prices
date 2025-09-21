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

function snapTo3Min(date = new Date()) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  const snappedMin = m - (m % 3);
  d.setMinutes(snappedMin);
  return d;
}

(async function main() {
  try {
    const price = await getPrice();
    const now = snapTo3Min(new Date());
    const iso = now.toISOString();

    let rows = loadRows();

    // avoid duplicate for same snapped timestamp
    const lastRow = rows.length > 1 ? rows[rows.length - 1] : null;
    if (lastRow) {
      const lastTs = lastRow.split(',')[0];
      if (lastTs === iso) {
        console.log('Already recorded for', iso);
        return;
      }
    }

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
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
