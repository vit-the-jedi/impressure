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

  const testIntegrationResponse = new Promise((resolve, reject) => {
    const testObj = {
      responses: {
        bid_id: 1234,
        data: {
          homeownder: true,
          insuranceProvider: "Allstate",
          drivers: [
            {
              firstName: "matt",
              lastName: "vitello",
              address: "116 test st",
              phone: "2033333333",
              insured: 1,
              vehicleYear: "2017",
              vehicleType: "Kia Sorento",
              dob: "1995-08-23",
            },
            {
              firstName: "ilona",
              lastName: "toth",
              address: "116 test st",
              phone: "2033333333",
              insured: 1,
              vehilceYear: "2017",
              vehicleType: "Jeep Cherokee",
              dob: "1996-11-09",
            },
          ],
        },
      },
    };

    setTimeout(() => {
      resolve(testObj);
    }, 3000);
  });

  testIntegrationResponse
    .then((data) => {
      res.render("responses", {
        data: { responses },
      });
      console.log(data);
    })
    .catch((error) => {
      console.log(error);
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
