const express = require("express");
const url = "https://preview.impressure.io/cdjvks65-protect-com";
const impressureFormComplete = require("./utils/mv-scraper");
const app = express();
app.set("view engine", "pug");

app.get("/", (req, res) => {
    const integrationResponses = new Promise((resolve, reject) => {
        impressureFormComplete
            .handler(url)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => reject("form completion failed"));
    });

    Promise.all([integrationResponses])
        .then(([...data]) => {
            const obj = {};
            for (let i = 0; i < data.length; i++) {
                res.render("index", {
                    data: { integration: data[i] },
                });
            }
        })
        .catch((err) => res.status(500).send(err));
});

app.listen(process.env.PORT || 3000);
