const { resolve } = require("path");

const generateRandomDOBValue = async (type) => {
  new Promise((resolve, reject) => {
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

module.exports.generateRandomDOBValue = generateRandomDOBValue;
