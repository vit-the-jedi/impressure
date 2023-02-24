const express = require("express");

const scraper = require("./utils/scraper");
const app = express();

app.set("view engine", "pug");
//config object for our script
const config = {
    link: "https://preview.impressure.io/cdjvks65-protect-com",
    mobile: "on",
    integrations: "on",
    targetIntegrations: ["Mastadon", "L&C"],
    noBrowser: true,
    fakePerson: {
        email: "puppeteerProtectTe@st.com",
        "first name": "Test",
        "last name": "Test",
        "street address": {
            street: "116 test street",
            city: "Beacon Falls",
            state: "CT",
            zipCode: "06672",
        },
        "primary phone": "2033333345",
    },
    typeDelay: 0,
    slowMo: 0,
};
app.get("/", (req, res) => {
    const pageIntegrationResponses = new Promise((resolve, reject) => {
        scraper
            .submitForm(config)
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
