const puppeteer = require("puppeteer");

const handler = async (url) => {
    console.log("starting");
    const data = await completeForm(url, finish);
    console.log(data);
    return data;
};

const completeForm = async (url, callback) => {
    const logActions = async (action) => {
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
    const browser = await puppeteer.launch({
        headless: config.noBrowser,
        slowMo: config.slowMo,
    });
    const page = await browser.newPage();
    //wait for react to finish here
    try {
        await Promise.all([
            page.goto(event.url || config.link),
            page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            logActions(`opening browser at: ${config.link} `),
        ]);
    } catch (error) {}
    //get Impressure iframe (frame holds the preview page)
    //we'll need to use the Impressure frame for all clicks, value inputting, etc
    //using page. will not work
    const iframe = await page.$("#impressure-1");
    const impressureFrameContent = await iframe.contentFrame();
    //enable our config settings before we start
    await initConfig(page);
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

    await runPageChecks();

    async function getPageName() {
        try {
            const pageNameEl = await page.$(".pageName");
            const pageNameElText = await pageNameEl.getProperty("innerText");
            const nameText = await pageNameElText.jsonValue();
            const newPageName = nameText.toLowerCase();
            return newPageName;
        } catch (error) {
            console.log(
                `Currently, only impressure preview links are supported, see https://github.com/vit-the-jedi/impressure/issues/18 for status on non-impressure preview link support.`
            );
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
                const zipInput = await impressureFrameContent.$("input");
                await impressureFrameContent.evaluate((el) => {
                    el.value = "";
                }, zipInput);
                //await zipInput.click();
                await zipInput.type(
                    `${config.fakePerson["street address"].zipCode}`,
                    {
                        delay: config.typeDelay,
                    }
                );
            } else if (pageName.includes("birth year")) {
                logActions(`inputting birth year`);
                const randomYear = generateRandomDOBValue("year");
                await impressureFrameContent.evaluate(() => {
                    document.querySelector(`input`).value = "";
                });
                await impressureFrameContent.type("input", String(randomYear), {
                    delay: config.typeDelay,
                });
                //remove focus (good for testing DOB autocomplete)
                await impressureFrameContent.evaluate(() => {
                    document.querySelector(`input`).blur();
                });
            } else if (pageName.includes("birthdate full")) {
                logActions(`inputting full birth date`);
                const randomDOBVals = [
                    generateRandomDOBValue("month"),
                    generateRandomDOBValue("day"),
                    generateRandomDOBValue("year"),
                ];
                const inputs = await impressureFrameContent.$$("input");

                for (const [i, input] of inputs.entries()) {
                    await impressureFrameContent.evaluate((el) => {
                        el.value = "";
                    }, input);
                    await input.click();
                    await input.type(String(randomDOBVals[i]), {
                        delay: config.typeDelay,
                    });
                }
                //remove focus (good for testing DOB autocomplete)
                await impressureFrameContent.evaluate(() => {
                    document.querySelector(`input`).blur();
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
                if (config.integrations === "off") {
                    console.log("stopping submit");
                    needsToSubmit = false;
                    shouldContinue = false;
                    logActions(
                        "closing browser, integrations are turned off in the config object."
                    );
                }
            } else if (pageName.includes("offers")) {
                shouldContinue = false;
            } else if (pageName.includes("vehicle")) {
                needsToSubmit = false;
                await impressureFrameContent
                    .waitForSelector(".formQuestionRadio")
                    .then(() => {
                        //function to look through the given selector for the radio buttons
                        radioButtonHandler(".formQuestionRadio");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } else {
                needsToSubmit = false;
                await impressureFrameContent
                    .waitForSelector(".radioButtons")
                    .then(() => {
                        //function to look through the given selector for the radio buttons
                        radioButtonHandler(".radioButtons");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }

            if (shouldContinue) {
                try {
                    nextPage(needsToSubmit, shouldContinue);
                } catch (error) {
                    console.log(error);
                }
            } else {
                callback(responses, browser);
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
            const targetInputId = await impressureFrameContent.evaluate(
                (label) => {
                    const siblingContainer = label.nextElementSibling;
                    const id = siblingContainer.querySelector("input").id;
                    return id;
                },
                label
            );

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
            await impressureFrameContent.click(`#${targetInputId}`);
            //enter the associated value
            await impressureFrameContent.type(`#${targetInputId}`, value, {
                delay: config.typeDelay,
            });
            //also need to remove impressure email suggestions dropdown lists
            //it gets in the way of the submit btn click and causes an error
            if (labelText.includes("mail")) {
                await impressureFrameContent
                    .waitForSelector(".suggestions")
                    .then(() => {
                        //if impressure shows the emaill address suggestions, we can hit the escape key to remove the list
                        page.keyboard.press("Escape");
                        //then we need to check if the validation message is there
                        impressureFrameContent.evaluate(() => {
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
            }
        }
    }
    function radioButtonHandler(selector) {
        //loop through our radio btn containers and click one label from each
        impressureFrameContent.evaluate((selector) => {
            document.querySelectorAll(selector).forEach((selectorDiv) => {
                //get labels regardless of class or id
                const labelsArray = selectorDiv.querySelectorAll("label");
                if (labelsArray) {
                    const randomIndex = Math.floor(
                        Math.random() * labelsArray.length
                    );
                    labelsArray[randomIndex].click();
                }
            });
        }, selector);
    }

    //click next button
    async function nextPage(submitButtonClickFlag, shouldContinue) {
        console.log(submitButtonClickFlag, shouldContinue);
        try {
            //check our flag to ensure that we need to click a submit button
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
                            const randomIndex = Math.floor(
                                Math.random() * btns.length
                            );
                            btns[randomIndex].click();
                        });
                    } else {
                        await hasNextButton[0].evaluate((b) => b.click());
                    }
                }
            }
            //assume we want to continue, get the new page name we navigated to
            const pageName = await getPageName();
            //log the page we're on + the action being completed
            await logActions(`navigating to page: ${pageName}`);
            await runPageChecks();
        } catch (error) {
            console.log(error);
        }
    }

    const generateRandomDOBValue = (type) => {
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
        return minValue + randNumToAdd;
    };

    //read our configs and set up the page before we start
    async function initConfig(page) {
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

            logActions("switching to mobile");
        }
        if (config.integrations === "on") {
            const element = await page.$(".zmdi-cloud-off");
            if (element) {
                const parent_node = await element.getProperty("parentNode");
                await parent_node.click();
            }
            logActions("turning integrations on");
        }
    }
    //function that watched the console logs for the integrations responses we need
    //this function is called at the beginning of the app, and therefore watches every console log
    //you can access all logs from here, but we are currently only concerned with integration logs
    const responses = [];
    async function logIntegrations() {
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
                            responses.push(cleanedVals);
                            integrationsProcessed++;
                            if (
                                integrationsProcessed >=
                                config.targetIntegrations.length * 2
                            ) {
                                logActions(
                                    `closing browser: logged target integrations ${config.targetIntegrations} post and ${config.targetIntegrations} response data.`
                                );
                                resolve(responses);
                            }
                        }
                    }
                } catch (error) {
                    console.log(error);
                    return callback(error);
                }
            });
        }).then((res) => {
            return callback(res);
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
};

const finish = async (responses, browser) => {
    await browser.close();
    return responses;
};
module.exports.impressureFormComplete = handler;
