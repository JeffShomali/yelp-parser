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



// --------------- HELPERS
// Selectors

const SELECTOR = {
  "SERACHBOX": '#find_desc',
  "LOCATION": '#dropperText_Mast',
  "PAGINATIONLINKS": 'a.available-number,pagination-links_anchor',
  "BUSINESSNAME": 'a.biz-name.js-analytics-click'
}


async function log(status, message) {
  status === 'error' ? console.log(chalk.red(`\t${message}`)) : console.log(chalk.green(`\t${message}`));
}

async function buinessNamesUrlsCleaner(urls) {
  const _t = []
  urls.map(a => {
    if (a.includes('yelp.com/biz'))  _t.push(a.trim());
  })
  return _t
}


async function main() {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 800
  })

  try {
    await page.goto('http://yelp.com');
    log('success', 'Opening Yelp', `URL Loaded ${page.url()}`);
    await page.waitFor(1000);
  } catch (error) {
    log('error', "Opening Yelp.com", "Can't open Yelp.com")
  }


  try {
    await page.focus(SELECTOR.SERACHBOX)
    await page.type(SELECTOR.SERACHBOX, "Restaurant", {
      delay: 10
    })
    log('success', `Typing "Restaurant" in search field.`)

    await page.focus(SELECTOR.LOCATION)
    await page.type(SELECTOR.LOCATION, "Walnut Creek, CA", {
      delay: 10
    }) // location
    log('success', `Typing Walnut Creek, CA in search fields.`)
    const inputElement = await page.$('button[type=submit]');
    await inputElement.click();
    log('success', `Form Submitted`)
    await page.waitForNavigation()
    await page.waitFor(2000);

    // Get all paginations links
    const pageLinks = []
    pageLinks.push(page.url()) // push the current link into all links
    const links = await page.$$eval(SELECTOR.PAGINATIONLINKS, as => as.map(a => a.href.trim()))
    pageLinks.push(...links) // push all the pagination links into all links
    log('sucess', 'Links Scrapped')

    async function gotToEachPageAndScrapData(url) {
      let _temp = []
      const page = await browser.newPage();
      await page.goto(url)
      page.waitForFunction()
      page.waitFor(1000)
      await page.close()
    }

    //--------- Get all Business Links from each page
    await page.waitForSelector('a.biz-name.js-analytics-click');
    let businessNames = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a.biz-name.js-analytics-click'))
      return links.map(link => link.href).slice(0, 10)
    })
    log('success', 'Business names scrapped');

    businessNames = await buinessNamesUrlsCleaner(businessNames);
    console.log(businessNames)
    // await gotToEachPageAndScrapData(links[0])

  } catch (error) {
    log('error', `Ooops! ${error.message}`)
  }










  // await browser.close();
}

main();