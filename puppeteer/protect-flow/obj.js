import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

//create puppeteer browser
const browser = await puppeteer.launch({
  headless: true,
  slowMo: 0,
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
(async () => {
  //wait for react to finish here
  await Promise.all([
    page.goto("https://google.com"),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  ]);

  logIntegrations();
  const values = {
    data: {
      address: "116 test street",
      bi_per_incident: 300000,
      bi_per_person: 100000,
      continuous_coverage: 30,
      coverage_type: "Standard Protection",
      current_company: "Geico",
    },
    drivers: [
      {
        bankruptcy: false,
        credit_rating: "Good",
        date_of_birth: "1959-10-10",
        education: "Associate",
        first_licensed: 17,
        first_name: "Test",
        gender: "F",
        last_name: "Test",
        license_status: "active",
        marital_status: "Married",
        occupation: "unemployed",
        primary_vehicle: 1,
        relationship: "self",
        sr_22: false,
      },
      {
        date_of_birth: null,
        gender: "",
        marital_status: "",
        occupation: "unknown",
      },
    ],
  };
  //type in the Impressure console command to output all of our debug messages
  await page.evaluate((values) => {
    console.log(values);
  }, values);
})().catch((err) => console.error(err));

function logIntegrations() {
  return new Promise((resolve, reject) => {
    page.on("console", async (msg) => {
      try {
        let msgText = msg.text();
        if (msgText) {
          const args = msg.args();
          console.log(msg.args());
          const vals = [];
          for (let i = 0; i < args.length; i++) {
            vals.push(await args[i].jsonValue());
          }

          const cleanedVals = await cleanIntegrations(vals);
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
}
const cleanIntegrations = (values) => {
  //   console.log(Object.values(values));
  //   const integrationObj = {};
  //   //set integration name
  //   const intergrationObjKey = values[0];
  //   for (let i = 0; i < values.length; i++) {
  //     if (typeof values[i] === "object") {
  //       integrationObj[intergrationObjKey] = values[i];
  //     }
  //   }
  //   return integrationObj;
};
