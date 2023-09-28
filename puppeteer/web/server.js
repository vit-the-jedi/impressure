const express = require("express");

const scraper = require("./utils/scraper");
const app = express();

//live reload express server on code changes
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

//use live reload
app.use(connectLiveReload());


const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", (res) => {
    setTimeout(() => {
        liveReloadServer.refresh("/iframe");
    }, 100);
});


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
    res.render("index");
});

app.get("/iframe", (req, res) => {

    const pageIntegrationResponses = new Promise((resolve, reject) => {
        scraper
            .controller(config)
            .then((data) => {
                console.log("resolved on server" + data);
                resolve(data);
            })
            .catch((err) => {
                console.log(error);
                reject("Impressure scrape failed");
            })
            .then((data) => {
                //inject text into iframe
                res.render("iframe", {
                    data: { text: "hello in iframe" }
                })
            })
            .catch((err) => res.status(500).send(err));
    });

})

app.listen(process.env.PORT || 2001);
