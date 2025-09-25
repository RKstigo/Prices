const { Octokit } = require("@octokit/rest");

const GIST_ID = process.env.GIST_ID; // from Render env
const FILE_NAME = "jupPrices.csv";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function updateGist(newLine) {
  // 1. Get current gist content
  const gist = await octokit.gists.get({ gist_id: GIST_ID });
  const file = gist.data.files[FILE_NAME];
  const oldContent = file && file.content ? file.content.trim() : "timestamp,price";

  // 2. Split into rows and prune older than 3 days
  const rows = oldContent.split("\n");
  const header = rows[0];
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days in ms

  const newRows = rows
    .slice(1)
    .filter(r => {
      const t = new Date(r.split(",")[0]).getTime();
      return !isNaN(t) && t >= cutoff;
    });

  // 3. Add new tick
  newRows.push(newLine);
  const updated = [header, ...newRows].join("\n");

  // 4. Update Gist
  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      [FILE_NAME]: { content: updated },
    },
  });

  console.log("Gist updated with 3-day pruning.");
}

module.exports = { updateGist };
