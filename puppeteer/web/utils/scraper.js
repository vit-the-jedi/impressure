const { resolve } = require("path");
const puppeteer = require("puppeteer");
const randomDob = require("./randomDob");

const logActions = async (action) => {
  const actionStr = `
  -------------------------
  COMPLETING ACTION:
  ${action}`.padStart(10, " ");
  console.log(actionStr);
};

const submitForm = async (config) => {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 0,
  });
  const page = await browser.newPage();
  await page.goto("https://preview.impressure.io/cdjvks65-protect-com");
  const iframe = await page.$("#impressure-1");
  const impressureFrameContent = await iframe.contentFrame();
  const controllerObj = {};
  const getPageName = async () => {
    const pageNameEl = await page.$(".pageName");
    const pageNameElText = await pageNameEl.getProperty("innerText");
    const nameText = await pageNameElText.jsonValue();
    const newPageName = nameText.toLowerCase();

    const pageLogicActions = await runPageChecks(newPageName);

    if (pageLogicActions.continue) {
      if (pageLogicActions.submit) {
        try {
          //find submit buttons
          const hasNextButton = await impressureFrameContent.$$(
            '[data-behaviors="submit nextPage"]'
          );
          //if there's more than 1 submit button, click a random one
          if (hasNextButton.length > 1) {
            await impressureFrameContent.evaluate(() => {
              const btns = document.querySelectorAll(
                '[data-behaviors="submit nextPage"]'
              );
              const randomIndex = Math.floor(Math.random() * btns.length);
              btns[randomIndex].click();
            });
          } else {
            //click the button
            await hasNextButton[0].evaluate((b) => b.click());
          }
        } catch (error) {
          console.log(error);
        }
      }
      //recursively call our controller function to start again on new page
      setTimeout(() => {
        getPageName();
      }, 200);
    } else {
      //set our data to the globally-accessible obj so we can export it back to the server
      controllerObj.send = pageLogicActions;
      //be sure to return true here
      return true;
    }
  };

  const runPageChecks = async (name) => {
    console.log(`page name: ${name}`);
    //pass this back to see if we need to recursively call our pageName and pageChecks functions
    const pageLogicObj = {};
    if (
      name.includes("zip") ||
      name.includes("zip code") ||
      name.includes("landing page")
    ) {
      const zipInput = await impressureFrameContent.$("input");
      try {
        await impressureFrameContent.evaluate((el) => {
          el.value = "";
        }, zipInput);
        //await zipInput.click();
        await zipInput.type(`06492`, {
          delay: 0,
        });
        //continue = true means we want to go to next page
        //submit = true means we need to click a submit button to move forward
        //we will add a data param in this object to pass along and array of our integration responses when the time comes.
        pageLogicObj.continue = true;
        pageLogicObj.submit = true;
        return pageLogicObj;
      } catch (error) {
        console.log(error);
      }
    } else if (name.includes("birth year")) {
      logActions(`inputting birth year`);
      const randomYear = await randomDob.generateRandomDOBValue("year");
      console.log(randomYear);
      await impressureFrameContent.evaluate(() => {
        document.querySelector(`input`).value = "";
      });
      // await impressureFrameContent.type("input", randomYear, {
      //   delay: 0,
      // });
      //remove focus (good for testing DOB autocomplete)
      await impressureFrameContent.evaluate(() => {
        document.querySelector(`input`).blur();
      });
      pageLogicObj.continue = true;
      pageLogicObj.submit = true;
      return pageLogicObj;
    } else if (name.includes("birthdate full")) {
      logActions(`inputting full birth date`);
      const randomDOBVals = [
        await randomDob.generateRandomDOBValue("month"),
        await randomDob.generateRandomDOBValue("day"),
        await randomDob.generateRandomDOBValue("year"),
      ];
      const inputs = await impressureFrameContent.$$("input");

      for (const [i, input] of inputs.entries()) {
        await impressureFrameContent.evaluate((el) => {
          el.value = "";
        }, input);
        await input.click();
        await input.type(String(randomDOBVals[i]), {
          delay: 0,
        });
      }
      //remove focus (good for testing DOB autocomplete)
      await impressureFrameContent.evaluate(() => {
        document.querySelector(`input`).blur();
      });
      pageLogicObj.continue = true;
      pageLogicObj.submit = true;
      return pageLogicObj;
    } else if (name.includes("tcpa") || name.includes("info mobile")) {
      const labels = await impressureFrameContent.$$(".form-label");
      //call our helper function when we have multiple text inputs
      await inputValueHelper(labels, name, impressureFrameContent);

      pageLogicObj.continue = true;
      pageLogicObj.submit = true;
      return pageLogicObj;
    } else if (name.includes("offers")) {
      //we do not want to continue anymore
      //also want to look for integration responses and stuff
      pageLogicObj.continue = false;
      pageLogicObj.submit = false;
      return pageLogicObj;
    } else if (name.includes("vehicle") || name.includes("insurance")) {
      await impressureFrameContent
        .waitForSelector(".formQuestionRadio")
        .then((target) => {
          //function to look through the given selector for the radio buttons
          radioButtonHandler(".radioButtons", impressureFrameContent);
        })
        .catch((error) => {
          console.log(error);
        });
      pageLogicObj.continue = true;
      pageLogicObj.submit = false;
      return pageLogicObj;
    } else {
      try {
        await impressureFrameContent
          .waitForSelector(".radioButtons")
          .then((target) => {
            //function to look through the given selector for the radio buttons
            radioButtonHandler(".radioButtons", impressureFrameContent);
          })
          .catch((error) => {
            console.log(error);
          });
        pageLogicObj.continue = true;
        pageLogicObj.submit = false;
        return pageLogicObj;
      } catch (error) {
        console.log(error);
        console.log("hello");
      }
    }
  };

  //this func call will only return true once we have finished the flow
  //it will wait for the return until we're done
  const finished = await getPageName();

  //when ready, uncomment this line to send final data back to server
  //if(finished)return controllerObj;
};

//helper function to help distinguish the values each text input needs
//we use the input labels to make decisions for what to input
async function inputValueHelper(labels, pageName, iframe) {
  try {
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelText = await iframe.evaluate((label) => {
        //use label text content to figure out which values are needed
        //we need to do this bc we can't rely on Impressure having usable id's
        let str = label.textContent.toLowerCase();
        if (str.includes(":")) str = str.split(":")[0];
        else if (str.includes("*")) str = str.replace("*", "");
        return str.trim();
      }, label);
      const targetInputId = await iframe.evaluate((label) => {
        const siblingContainer = label.nextElementSibling;
        const id = siblingContainer.querySelector("input").id;
        return id;
      }, label);

      let value;
      switch (labelText) {
        case "first name":
          value = `${config.fakePerson["first name"]}`;
          break;
        case "last name":
          value = `${config.fakePerson["last name"]}`;
          break;
        case "street address":
          value = `${config.fakePerson["street address"].street}`;
          break;
        case "primary phone":
          value = `${config.fakePerson["primary phone"]}`;
          break;
        case "e-mail":
        case "email":
          value = `${config.fakePerson["email"]}`;
          break;
        default:
          value = "test";
      }
      logActions(`inputting value: ${value}`);
      //click the input
      await iframe.click(`#${targetInputId}`);
      //enter the associated value
      await iframe.type(`#${targetInputId}`, value, {
        delay: 0,
      });
      //also need to remove impressure email suggestions dropdown lists
      //it gets in the way of the submit btn click and causes an error
      if (labelText.includes("mail")) {
        await iframe.waitForSelector(".suggestions").then(() => {
          //if impressure shows the emaill address suggestions, we can hit the escape key to remove the list
          page.keyboard.press("Escape");
          //then we need to check if the validation message is there
          iframe.evaluate(() => {
            const validationMsg = document.querySelector(
              `.validation--suggestion`
            );
            if (validationMsg)
              //if it is, click the "no" option in the validate message - allows us to keep the email we typed in
              validationMsg.querySelectorAll("button")[1].click();
          });
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
}
function radioButtonHandler(selector, iframe) {
  try {
    //loop through our radio btn containers and click one label from each
    iframe.evaluate((selector) => {
      document.querySelectorAll(selector).forEach((selectorDiv) => {
        //get labels regardless of class or id
        const labelsArray = selectorDiv.querySelectorAll("label");
        if (labelsArray) {
          const randomIndex = Math.floor(Math.random() * labelsArray.length);
          labelsArray[randomIndex].click();
        }
      });
    }, selector);
  } catch (error) {
    console.log(error);
  }
}

module.exports.submitForm = submitForm;
