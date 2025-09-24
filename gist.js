const { Octokit } = require("@octokit/rest");

const GIST_ID = process.env.GIST_ID; // from Render env
const FILE_NAME = "prices.csv";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function updateGist(newLine) {
  // 1. Get current gist content
  const gist = await octokit.gists.get({ gist_id: GIST_ID });
  const file = gist.data.files[FILE_NAME];
  const oldContent = file && file.content ? file.content.trim() : "timestamp,price";

  // 2. Append new line
  const updated = oldContent + "\n" + newLine;

  // 3. Push update
  await octokit.gists.update({
    gist_id: GIST_ID,
    files: {
      [FILE_NAME]: { content: updated },
    },
  });

  console.log("Gist updated successfully.");
}

module.exports = { updateGist };
