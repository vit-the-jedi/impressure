const express = require("express");
const path = require("path");
const scraper = require("./utils/scraper");
const app = express();
app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "pug");
//config object for our script
app.get("/", (req, res) => {
    res.render("index", {
        title: "Impressure Form Tester",
        message: "Test impressure forms instantly!",
        content: "hello",
    });
});
app.get("/go", (req, res) => {
    res.render("go", {
        title: "Impressure Form Tester",
    });
    // const pageIntegrationResponses = new Promise((resolve, reject) => {
    //     scraper
    //         .controller(config)
    //         .then((data) => {
    //             console.log("resolved on server" + data);
    //             resolve(data);
    //         })
    //         .catch((err) => {
    //             console.log(error);
    //             reject("Impressure scrape failed");
    //         })
    //         .then((data) => {
    //             // res.render("responses", {
    //             //     data: { articles: data[0], videos: data[1] },
    //             // });
    //         })
    //         .catch((err) => res.status(500).send(err));
    // });
});

app.listen(process.env.PORT || 2001);
