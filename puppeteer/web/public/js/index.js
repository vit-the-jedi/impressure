"use strict";

const goLink = document.querySelector("#route-to-go");
const form = document.querySelector("#configForm");
const checkboxes = form.querySelectorAll("input[type='checkbox'");

//workaround for formData not posting unchecked checkboxes
//we are expecting the value "off" in our config object
//set an associated hidden input with the "off" value for posting
const checkboxChangeHandler = (ev) => {
    const associatedHiddenInput = document.querySelector(
        `input[type='hidden'][name='${ev.target.name}']`
    );
    if (!ev.target.checked) {
        associatedHiddenInput.value = "off";
    } else {
        associatedHiddenInput.value = "";
    }
};

const checkboxLoadHandler = () => {
    const associatedHiddenInput = document.querySelector(
        `input[type='hidden'][name='${ev.target.name}']`
    );
    checkboxes.forEach((check) => {
        if (!check.checked) {
            associatedHiddenInput.value = "off";
        } else {
            associatedHiddenInput.value = "";
        }
    });
};

checkboxes.forEach((check) => {
    check.addEventListener("change", checkboxChangeHandler);
});

//config object we will send along to our /go route in express
//if you want to keep anything default, simply leave it as-is
//we will change whatever settings we need to in sendToGoPage();
const initialConfig = {
    targetLink: "https://preview.impressure.io/cdjvks65-protect-com",
    mobile: "on",
    integrations: "on",
    targetIntegrations: ["Mastadon", "L&C"],
    noBrowser: true,
    typeDelay: 0,
    slowMo: 0,
};

//function to gather our form data and append it to the url
//from there we can start our scraper with the data the user provided + any remaining defaults
const sendToGoPage = (ev) => {
    ev.preventDefault();
    let linkHref = ev.target.href;
    new Promise((resolve, reject) => {
        const url = new URL(window.location);
        const userConfigData = new FormData(form);
        for (const key of Object.keys(initialConfig)) {
            if (userConfigData.get(key) && userConfigData.get(key).length > 0) {
                initialConfig[key] = userConfigData.get(key);
            }
        }
        //apend our new object to the url as params
        //need to check for nested objects, if they exist, stringify them for our url params
        for (const param of Object.keys(initialConfig)) {
            url.searchParams.append(param, initialConfig[param]);
        }
        linkHref += `${url.search}`;
        resolve(linkHref);
    }).then((value) => {
        window.location.href = value;
    });
};

goLink.addEventListener("click", sendToGoPage);
