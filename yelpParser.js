const puppeteer = require('puppeteer');
var jsonfile = require('jsonfile')
var fs = require('fs')
var _ = require('lodash');
const chalk = require('chalk');




//TODO:
// 1. Go to Yelp
// 2. Input the Retaurant // or https://www.yelp.com/search?find_desc=italian+restaurant&find_loc=san+ramon&ns=1
// 3. Type the City
// 4. Select page one by one
//   4.1 Get restaurant name 
//   4.2 Click readmore 
//   4.3 go next page 
//   4.4 scrap Business name 
//   4.5 Adress 
//   4.6 Website

// Selectors


async function log(status, step, message) {

  if (status === 'error') {
    console.log(chalk.red(`\t${step} -> ${message}`))
  } else {
    console.log(chalk.green(`\t${step} -> ${message}`));
  }
}

async function submiySerachForm(page, typeofbusiness, location) {
  try {
    await page.focus('#find_desc')
    await page.type('#find_desc', typeofbusiness, {delay: 100}) // search bar
    // page.waitFor(200);
    await page.focus('#dropperText_Mast')
    await page.type('#dropperText_Mast', location, {delay: 100}) // location
    const inputElement = await page.$('button[type=submit]');
    await inputElement.click();
    log('success', `Typing ${typeofbusiness} and ${location} in search fields`, 'DONE')
  } catch (error) {
    log('error', `typing ${typeofbusiness} in search fild`, ' Failed!')
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://yelp.com');
    log('success', 'Opening Yelp', `URL Loaded ${page.url()}`);
    await page.waitFor(1000);
  } catch (error) {
    log('error', "Opening Yelp", "Can't open the yelp")
  }

  // Step 1: 
  await submiySerachForm(page, 'restaurants', 'walnut creek, ca');




  // await browser.close();
}

run();