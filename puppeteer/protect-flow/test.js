//👋👋👋 Please refer to the README.md file before starting!

// These lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");
import {
  randEmail,
  randFirstName,
  randLastName,
  randAddress,
  randPhoneNumber,
  random,
} from "@ngneat/falso";
import { link, linkSync } from "fs";
import { resolve } from "path";

const logActions = async (action) => {
  const actionStr = `
  -------------------------
  COMPLETING ACTION:
  ${action}`.padStart(10, " ");
  console.log(actionStr);
};
const frameObj = {};
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
//our fake data
const fakePerson = config.fakePerson;

//create puppeteer browser
const browser = await puppeteer.launch({
  headless: config.noBrowser,
  slowMo: config.slowMo,
});

//set up our page
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
(async () => {
  //wait for react to finish here
  await Promise.all([
    page.goto(config.link),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    logActions(`opening browser at: ${config.link} `),
  ]);

  //get Impressure iframe (frame holds the preview page)
  //we'll need to use the Impressure frame for all clicks, value inputting, etc
  //using page. will not work
  const iframe = await page.$("#impressure-1");
  const impressureFrameContent = await iframe.contentFrame();
  //enable our config settings before we start
  await initConfig(page);

  //type in the Impressure console command to output all of our debug messages
  await page.evaluate(() => console.log(Impressure.enableLogging("debug")));

  await runPageChecks();

  async function getPageName() {
    try {
      const pageNameEl = await page.$(".pageName");
      const pageNameElText = await pageNameEl.getProperty("innerText");
      const nameText = await pageNameElText.jsonValue();
      const newPageName = nameText.toLowerCase();
      return newPageName;
    } catch (error) {
      console.log(error);
    }
  }
  //function to do unique logic based on the different pages in the flow
  async function runPageChecks() {
    const pageName = await getPageName();
    //this is a flag for our nextPsge() function to decide if we need to click submit or not
    let needsToSubmit = true;
    let shouldContinue = true;
    try {
      if (
        pageName.includes("zip") ||
        pageName.includes("zip code") ||
        pageName.includes("landing page")
      ) {
        await impressureFrameContent.evaluate((fakePerson) => {
          document.querySelector(
            "input"
          ).value = `${fakePerson["street address"].zipCode}`;
        }, fakePerson);
      } else if (pageName.includes("birth year")) {
        logActions(`inputting birth year`);
        const randomYear = generateRandomYear();
        await impressureFrameContent.evaluate(() => {
          document.querySelector(`input`).value = "";
        });
        await impressureFrameContent.type("input", String(randomYear), {
          delay: config.typeDelay,
        });
      } else if (
        pageName.includes("tcpa") ||
        pageName.includes("info mobile")
      ) {
        const labels = await impressureFrameContent.$$(".form-label");
        //call our helper function when we have multiple text inputs
        await inputValueHelper(labels, pageName);

        //turning integrations off will abort submit to offers page
        //we will close broswer after we're done inputting
        try {
          if (pageName.includes("tcpa")) {
            if (config.integrations === "off") {
              shouldContinue = false;
              logActions(
                "closing browser, integrations are turned off in the config object."
              );
              browser.close();
            }
          }
        } catch (error) {
          console.log(error);
        }
      } else if (pageName.includes("offers")) {
        shouldContinue = false;
      } else {
        needsToSubmit = false;
        await impressureFrameContent
          .waitForSelector(".radioButtons")
          .then((radios) => {
            //loop through our radio btn containers and click one label from each
            impressureFrameContent.evaluate(() => {
              document.querySelectorAll(".radioButtons").forEach((radioDiv) => {
                const elemsArray = radioDiv.querySelectorAll("label");
                const randomIndex = Math.floor(
                  Math.random() * elemsArray.length
                );
                elemsArray[randomIndex].click();
              });
            });
          })
          .catch((error) => {
            console.log(error);
          });
      }
      nextPage(needsToSubmit, shouldContinue);
    } catch (error) {
      console.log(error);
    }
  }

  //helper function to help distinguish the values each text input needs
  //we use the input labels to make decisions for what to input
  async function inputValueHelper(labels, pageName) {
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelText = await impressureFrameContent.evaluate((label) => {
        //use label text content to figure out which values are needed
        //we need to do this bc we can't rely on Impressure having usable id's
        let str = label.textContent.toLowerCase();
        if (str.includes(":")) str = str.split(":")[0];
        else if (str.includes("*")) str = str.replace("*", "");
        return str.trim();
      }, label);
      const targetInputId = await impressureFrameContent.evaluate((label) => {
        const siblingContainer = label.nextElementSibling;
        const id = siblingContainer.querySelector("input").id;
        return id;
      }, label);

      let value;
      switch (labelText) {
        case "first name":
          value = `${fakePerson["first name"]}`;
          break;
        case "last name":
          value = `${fakePerson["last name"]}`;
          break;
        case "street address":
          value = `${fakePerson["street address"].street}`;
          break;
        case "primary phone":
          value = `${fakePerson["primary phone"]}`;
          break;
        case "e-mail":
        case "email":
          value = `${fakePerson["email"]}`;
          break;
        default:
          value = "test";
      }
      logActions(`inputting value: ${value}`);
      //make sure input is clear - sometimes impressure will save previous values - this will break our script and cause endless loop
      await impressureFrameContent.evaluate((targetInputId) => {
        document.querySelector(`#${targetInputId}`).value = "";
      }, targetInputId);
      //tab press is workaround for puppeteer clicking Impressure email dropdown helper instead of submit btn
      //right now - you'll see impressure highlighting errors between inputs - its OK for now
      await impressureFrameContent.click(`#${targetInputId}`);
      await impressureFrameContent.type(`#${targetInputId}`, value, {
        delay: config.typeDelay,
      });
      //also need to remove impressure email suggestions dropdown list
      //it gets in the way of the submit btn click and causes an error
      if (labelText.includes("mail")) {
        await impressureFrameContent
          .waitForSelector(".suggestions")
          .then(() => {
            impressureFrameContent.evaluate(() => {
              document.querySelector(".suggestions").style.display = "none";
              document.querySelector(".validation--suggestion").style.display =
                "none";
            });
          });
      }
    }
  }

  //click next button
  async function nextPage(submitButtonClickFlag, shouldContinue) {
    try {
      if (submitButtonClickFlag) {
        const hasNextButton = await impressureFrameContent.$$(
          '[data-behaviors="submit nextPage"]'
        );
        if (hasNextButton.length > 0) {
          if (hasNextButton.length > 1) {
            await impressureFrameContent.evaluate(() => {
              const btns = document.querySelectorAll(
                '[data-behaviors="submit nextPage"]'
              );
              const randomIndex = Math.floor(Math.random() * btns.length);
              btns[randomIndex].click();
            });
          } else {
            await hasNextButton[0].click();
          }
        }
      }
      if (shouldContinue) {
        const pageName = await getPageName();
        //log the page we're on + the action being completed
        await logActions(`navigating to page: ${pageName}`);
        await runPageChecks();
      }
    } catch (error) {
      console.log(error);
    }
  }
})().catch((err) => console.error(err));

const generateRandomYear = () => {
  const minYear = 1922;
  const randNumToAdd = Math.floor(Math.random() * 80);
  return minYear + randNumToAdd;
};

//read our configs and set up the page before we start
async function initConfig(page) {
  if (config.mobile === "on") {
    const element = await page.$(".zmdi-smartphone");
    const parent_node = await element.getProperty("parentNode");
    const classList = await page.evaluate((parent_node) => {
      return parent_node.classList;
    }, parent_node);
    for (const value of Object.values(classList)) {
      if (value === "toolbarPreview--disabled") {
        await parent_node.click();
      }
    }
    logActions("switching to mobile");
  }
  if (config.integrations === "on") {
    const element = await page.$(".zmdi-cloud-off");
    if (element) {
      const parent_node = await element.getProperty("parentNode");
      await parent_node.click();
    }
    logIntegrations();
    logActions("turning integrations on");
  }
}

function logIntegrations() {
  return new Promise((resolve, reject) => {
    const integratonsToTarget = config.targetIntegrations;
    let integrationsProcessed = 0;
    page.on("console", async (msg) => {
      try {
        let msgText = msg.text();
        for (const integrationName of integratonsToTarget) {
          if (msgText.includes(integrationName)) {
            const args = msg.args();
            const vals = [];
            for (let i = 0; i < args.length; i++) {
              vals.push(await args[i].jsonValue());
            }

            const cleanedVals = await cleanIntegrations(vals);
            setTimeout(() => {
              console.log(cleanedVals);
              integrationsProcessed++;
              if (
                integrationsProcessed >=
                config.targetIntegrations.length * 2
              ) {
                logActions(
                  `closing broswer: logged target integrations ${config.targetIntegrations} post and ${config.targetIntegrations} response data.`
                );
                browser.close();
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  });
}
const cleanIntegrations = (values) => {
  const integrationObj = {};
  //set integration name
  const intergrationObjKey = values[0];
  for (let i = 0; i < values.length; i++) {
    const objValue = values[i];
    if (typeof objValue === "object") {
      // integrationObj[intergrationObjKey] = values[i];
      // const objToString = JSON.stringify(values[i], null, 2);
      // integrationObj[intergrationObjKey] = objToString;

      for (const [key, value] of Object.entries(objValue)) {
        if (typeof value === "object") {
          objValue[key] = JSON.stringify(value, null, 2).replace(/\\n/g, "");
        }
      }
      integrationObj[intergrationObjKey] = objValue;
    }
  }
  return integrationObj;
};
// //generate random data for our test
// const generateRandData = () => {
//   const randData = {
//     email: randEmail(),
//     "first name": randFirstName(),
//     "last name": randLastName(),
//     "street address": randAddress(),
//     "primary phone": randPhoneNumber(),
//   };
//   return randData;
// };
