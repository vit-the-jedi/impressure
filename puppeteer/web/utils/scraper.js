const { resolve } = require("path");
const puppeteer = require("puppeteer");
const randomDob = require("./randomDob");
const integrationMethods = require("./integrationMethods");

//helper functions to step through the page
//this function is recursive, and continues to call itself until passed a param of continue =false

const getPageName = async (config, page, impressureFrameContent) => {
    const pageNameEl = await page.$(".pageName");
    const pageNameElText = await pageNameEl.getProperty("innerText");
    const nameText = await pageNameElText.jsonValue();
    const newPageName = nameText.toLowerCase();

    const pageLogicActions = await runPageChecks(
        config,
        newPageName,
        page,
        impressureFrameContent
    );

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
                        const randomIndex = Math.floor(
                            Math.random() * btns.length
                        );
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
        (async () => {
            setTimeout(async () => {
                await getPageName(config, page, impressureFrameContent);
            }, 200);
        })();
    }
};
//use the page name to make logical decisions on what to do
//input data, click submit buttons, or stop altogether
const runPageChecks = async (config, name, page, impressureFrameContent) => {
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
        const randomYear = await generateRandomDOBValue("year");
        await impressureFrameContent.evaluate(() => {
            document.querySelector(`input`).value = "";
        });
        await impressureFrameContent.type("input", randomYear, {
            delay: 0,
        });
        //remove focus (good for testing DOB autocomplete)
        await impressureFrameContent.evaluate(() => {
            document.querySelector(`input`).blur();
        });
        pageLogicObj.continue = true;
        pageLogicObj.submit = true;
        return pageLogicObj;
    } else if (name.includes("birthdate full")) {
        const randomDOBVals = [
            await generateRandomDOBValue("month"),
            await generateRandomDOBValue("day"),
            await generateRandomDOBValue("year"),
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
        await browser.close();
        const labels = await impressureFrameContent.$$(".form-label");
        //call our helper function when we have multiple text inputs
        await inputValueHelper(
            labels,
            page,
            name,
            impressureFrameContent,
            config
        );
        pageLogicObj.continue = true;
        pageLogicObj.submit = true;
        return pageLogicObj;
    } else if (name.includes("offers")) {
        pageLogicObj.continue = false;
        pageLogicObj.submit = false;
        return pageLogicObj;
    } else if (name.includes("vehicle") || name.includes("insurance")) {
        await impressureFrameContent
            .waitForSelector(".formQuestionRadio")
            .then((target) => {
                //function to look through the given selector for the radio buttons
                radioButtonHandler("label", impressureFrameContent);
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
                .waitForSelector(".formQuestionRadio")
                .then((target) => {
                    console.log("clicking");
                    //function to look through the given selector for the radio buttons
                    radioButtonHandler("label", impressureFrameContent);
                })
                .catch((error) => {
                    console.log(error);
                });
            pageLogicObj.continue = true;
            pageLogicObj.submit = false;
            return pageLogicObj;
        } catch (error) {
            console.log(error);
        }
    }
};
//helpers to input data into inputs logically
async function inputValueHelper(labels, page, name, iframe, config) {
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
                case "phone":
                case "phone number":
                    value = `${config.fakePerson["primary phone"]}`;
                    break;
                case "e-mail":
                case "email":
                case "email address":
                    value = `${config.fakePerson["email"]}`;
                    break;
                default:
                    value = "test";
            }
            //click the input
            await iframe.click(`#${targetInputId}`);
            //enter the associated value
            await iframe.type(`#${targetInputId}`, value, {
                delay: 0,
            });
            //also need to remove impressure email suggestions dropdown lists
            //it gets in the way of the submit btn click and causes an error
            if (labelText.includes("mail") || labelText.includes("email")) {
                try {
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
                                validationMsg
                                    .querySelectorAll("button")[1]
                                    .click();
                        });
                    });
                } catch (error) {}
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
            const labelsArray = document.querySelectorAll(selector);
            const randomIndex = Math.floor(Math.random() * labelsArray.length);
            labelsArray[randomIndex].click();
        }, selector);
    } catch (error) {
        console.log(error);
    }
}
//utility to generate random date values
const generateRandomDOBValue = async (type) => {
    return new Promise((resolve, reject) => {
        let minValue = 1;
        let randNumToAdd;
        if (type === "day") {
            randNumToAdd = Math.floor(Math.random() * 29);
        } else if (type === "month") {
            randNumToAdd = Math.floor(Math.random() * 11);
        } else if (type === "year") {
            minValue = 1922;
            randNumToAdd = Math.floor(Math.random() * 80);
        }
        const finalValue = String(minValue + randNumToAdd);
        resolve(finalValue);
    });
};
//controller function that waits for the pageLogic function to resolve
const controller = async (config) => {
    pageLogicObj = {};
    console.log("waiting");

    const integrationsGathered = await pageLogic(config);
    return integrationsGathered;
};

//function that steps through the form and resolves once the integration responses are resolved
async function pageLogic(config) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 0,
    });
    const page = await browser.newPage();
    await page.goto(config.link);
    const iframe = await page.$("#impressure-1");
    const impressureFrameContent = await iframe.contentFrame();
    const integratonsToTarget = config.targetIntegrations;

    //type in the Impressure console command to output all of our debug messages
    try {
        await page.evaluate(() =>
            console.log(Impressure.enableLogging("debug"))
        );
    } catch (error) {
        console.log(
            "This link does not support Impressure logs to the console"
        );
    }
    await initConfig(config, page);
    await getPageName(config, page, impressureFrameContent);
    //this is working, returning the integration responses once finished.
    //now we just need to build from here to go through the page + then resolve the responses
    return new Promise((resolve) => {
        const responses = [];
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
                        responses.push(cleanedVals);
                        setTimeout(() => {
                            integrationsProcessed++;
                            if (
                                integrationsProcessed >=
                                config.targetIntegrations.length * 2
                            ) {
                                //this is working, but we are getting "resolved on server[object Object],[object Object],[object Object],[object Object]"
                                //from the server.js log of the data - need to make sure this is getting passed in a way that we can read it
                                //on server.js
                                resolve(responses);
                                //close browser after we've resolved to the server
                                (async () => {
                                    await browser.close();
                                })();
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
            for (const [key, value] of Object.entries(objValue)) {
                if (typeof value === "object") {
                    objValue[key] = JSON.stringify(value, null, 2).replace(
                        /\\n/g,
                        ""
                    );
                }
            }
            integrationObj[intergrationObjKey] = objValue;
        }
    }
    return integrationObj;
};
//read our configs and set up the page before we start
async function initConfig(config, page) {
    if (config.mobile === "on") {
        try {
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
        } catch (error) {
            console.log(error);
        }
    }
    if (config.integrations === "on") {
        try {
            const element = await page.$(".zmdi-cloud-off");
            if (element) {
                const parent_node = await element.getProperty("parentNode");
                await parent_node.click();
            }
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports.controller = controller;
