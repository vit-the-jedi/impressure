const { resolve } = require("path");

const logIntegrations = async (config, page) => {
    const responses = [];
    return new Promise((resolve, reject) => {
        let integrationsProcessed = 0;
        page.on("console", async (msg) => {
            try {
                let msgText = msg.text();
                const args = msg.args();
                const vals = [];
                for (let i = 0; i < args.length; i++) {
                    vals.push(await args[i].jsonValue());
                }

                const cleanedVals = await cleanIntegrations(vals);
                responses.push(cleanedVals);
                console.log(responses);
                // integrationsProcessed++;
                // if (
                //     integrationsProcessed >=
                //     config.targetIntegrations.length * 2
                // ) {
                //     logActions(
                //         `closing browser: logged target integrations ${config.targetIntegrations} post and ${config.targetIntegrations} response data.`
                //     );
                //     resolve(responses);
                // }
            } catch (error) {
                console.log(error);
            }
        });
    });
};
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

module.exports.logIntegrations = logIntegrations;
