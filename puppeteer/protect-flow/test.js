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

const logActions = (action) => {
  const actionStr = `
  -------------------------
  COMPLETING ACTION:
  ${action}`.padStart(10, " ");
  console.log(actionStr);
};

//config object for our script
const config = {
  link: "https://preview.impressure.io/cdjvks65-protect-com",
  mobile: "on",
  integrations: "off",
  typeDelay: 0,
  noBrowser: false,
  slowMo: 200,
  fakePerson: {
    email: "puppeteerProtectTe@st.com",
    "first name": "John",
    "last name": "Test",
    "street address": {
      street: "116 test street",
      city: "Beacon Falls",
      state: "CT",
      zipCode: "06672",
    },
    "primary phone": "2033333345",
  },
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
  //enable our config settings before we start
  await initConfig(page);
  //type in the Impressure console command to output all of our debug messages
  await page.evaluate(() => console.log(Impressure.enableLogging("debug")));

  //get Impressure iframe (frame holds the preview page)
  //we'll need to use the Impressure frame for all clicks, value inputting, etc
  //using page. will not work
  const iframe = await page.$("#impressure-1");
  const impressureFrameContent = await iframe.contentFrame();

  //call our function to check page name and make decisions based on content of each page
  await runPageChecks();

  //function to do unique logic based on the different pages in the flow
  async function runPageChecks() {
    //get the Impressure page name for each page we're actively on
    //naming conventions across verticals are usually similar
    //so we can rely on them to have the same content
    const pageName = await page.evaluate(() => {
      return document.querySelector(".pageName").textContent.toLowerCase();
    });
    try {
      //log the page we're on + the action being completed
      logActions(`navigating to page: ${pageName}`);
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

        await nextPage();
      } else if (pageName.includes("birth year")) {
        logActions(`inputting birth year`);
        const randomYear = generateRandomYear();
        await impressureFrameContent.type("input", String(randomYear), {
          delay: config.typeDelay,
        });
        await nextPage();
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
              logActions(
                "closing browser, integrations are turned off in the config object."
              );
              browser.close();
            } else {
              await nextPage(pageName);
            }
          } else {
            await nextPage(pageName);
          }
        } catch (error) {
          console.log(error);
        }
      } else if (pageName.includes("offers")) {
        await page.waitForTimeout(60000);
        browser.close();
      } else {
        await impressureFrameContent.$$(".radioButtons");
        //loop through our radio btn containers and click one label from each
        await impressureFrameContent.evaluate(() => {
          document.querySelectorAll(".radioButtons").forEach((radioDiv) => {
            const elemsArray = radioDiv.querySelectorAll("label");
            const randomIndex = Math.floor(Math.random() * elemsArray.length);
            elemsArray[randomIndex].click();
          });
        });
        await runPageChecks();
      }
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
      //tab press is workaround for puppeteer clicking Impressure email dropdown helper instead of submit btn
      //right now - you'll see impressure highlighting errors between inputs - its OK for now
      await impressureFrameContent.click(`#${targetInputId}`);
      await impressureFrameContent.type(`#${targetInputId}`, value, {
        delay: config.typeDelay,
      });
      //also need to remove impressure email suggestions dropdown list
      //it gets in the way of the submit btn click and causes an error
      if (labelText.includes("mail")) {
        await impressureFrameContent.evaluate(
          () =>
            (document.querySelector(".suggestions__wrapper").style.display =
              "none")
        );
      }
    }
  }

  //click next button
  async function nextPage(pageName = null) {
    try {
      const hasNextButton = await impressureFrameContent.$$(
        '[data-behaviors="submit nextPage"]'
      );
      if (hasNextButton) {
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
      } else {
        console.error("Pupetteer Test: no submit button found");
      }
      await runPageChecks();
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
    try {
      page.on("console", async (msg) => {
        let msgText = msg.text();
        if (
          //add any integration identifiers you want here to view
          msgText.includes("Mastadon") ||
          msgText.includes("L&C")
        ) {
          const args = msg.args();
          const vals = [];
          for (let i = 0; i < args.length; i++) {
            vals.push(await args[i].jsonValue());
          }
          resolve(
            vals
              .map((v) =>
                typeof v === "object" ? JSON.stringify(v, null, 2) : v
              )
              .join("\t")
          );
          console.log(vals);
          console.log(
            "info log: if integration body is empty, the lead is either rejected, or there is an issue with your page integrations."
          );
        }
      });
    } catch (error) {
      console.log(error);
    }
  });
}

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
