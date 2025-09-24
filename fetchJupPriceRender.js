const fetch = require("node-fetch"); // make sure node-fetch is installed

const API_URL =
  "https://lite-api.jup.ag/price/v3?ids=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

// Fetch price from Jupiter API
async function getPrice() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const obj = data[
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
  ];
  if (!obj || typeof obj.usdPrice !== "number")
    throw new Error("Price missing in response");
  return obj.usdPrice;
}

// Retry wrapper
async function getPriceWithRetry() {
  const delays = [3000, 5000, 10000]; // ms
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await getPrice();
    } catch (err) {
      if (i < delays.length) {
        console.error(
          `Attempt ${i + 1} failed: ${err.message}. Retrying in ${
            delays[i] / 1000
          }s...`
        );
        await new Promise((r) => setTimeout(r, delays[i]));
      } else {
        throw err;
      }
    }
  }
}

// Main function called by server
async function main(updateGist) {
  const price = await getPriceWithRetry();
  const iso = new Date().toISOString();
  const line = `${iso},${price}`;
  await updateGist(line);
  console.log(`Saved ${line}`);
}

module.exports = main;
