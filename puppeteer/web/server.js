const express = require("express");

const scraper = require("./utils/scraper");
const app = express();

app.set("view engine", "pug");

app.get("/", (req, res) => {
  const pageIntegrationResponses = new Promise((resolve, reject) => {
    scraper
      .submitForm()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log(error);
        reject("Impressure scrape failed");
      })
      .then((data) => {
        res.render("index", {
          data: { articles: data[0], videos: data[1] },
        });
      })
      .catch((err) => res.status(500).send(err));
  });
});

app.listen(process.env.PORT || 1000);
