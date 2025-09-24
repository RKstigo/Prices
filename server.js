const express = require("express");
const main = require("./fetchJupPrice");
const { updateGist } = require("./gist");

const app = express();
const port = process.env.PORT || 3000;

app.get("/tick", async (req, res) => {
  try {
    await main(updateGist);
    res.send("Tick success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Tick failed: " + err.message);
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
