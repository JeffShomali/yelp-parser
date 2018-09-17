const puppeteer = require('puppeteer');
var jsonfile = require('jsonfile')
var fs = require('fs')
var _ = require('lodash');
const chalk = require('chalk');



// --------------- HELPERS

const SELECTOR = {
  "SERACHBOX": '#find_desc',
  "LOCATION": '#dropperText_Mast',
  "PAGINATIONLINKS": 'a.available-number,pagination-links_anchor',
  "BUSINESSNAME": 'a.biz-name.js-analytics-click'
}

/**
 * Log to the console
 * @param {string} status 
 * @param {string} message 
 */
async function log(status, message) {
  status === 'error' ? console.log(chalk.red(`\t${message}`)) : console.log(chalk.green(`\t${message}`));
}

/**
 *  Remove Ads from list of links
 * @param {arrays} urls 
 * @return array of links without ads links
 */
function buinessNamesUrlsCleaner(urls) {
  const _t = []
  urls.map(a => {
    if (a.includes('yelp.com/biz')) _t.push(a.trim());
  })
  return _t
}




async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    timeout: 0
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

    //---------------  Get all paginations links
    const paginationUrls = []
    paginationUrls.push(page.url()) // push the current link into all links
    const links = await page.$$eval(SELECTOR.PAGINATIONLINKS, as => as.map(a => a.href.trim()))
    paginationUrls.push(...links) // push all the pagination links into all links
    log('sucess', 'Links Scrapped')

    // -------------------- Get each pagination links and get business links
    var allRestauranLinks = []
    async function gotToEachPaginationLinksAndGetBusinessLinks(url) {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        Referer: 'https://yelp.com/'
      })
      await page.goto(url, {timeout: 0})
      await page.waitForSelector('a.biz-name.js-analytics-click');

      let businessNames = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.biz-name.js-analytics-click'))
        return links.map(link => link.href)
      })

      let businessNamesLinksWithoutAds = buinessNamesUrlsCleaner(businessNames)
      allRestauranLinks.push(...businessNamesLinksWithoutAds)
      log('success', 'Business names scrapped and trying to close this page.');
      await page.close();

    }

    //--------- Get all Business Links from each page
    for (const link of paginationUrls) {
      await gotToEachPaginationLinksAndGetBusinessLinks(link)
    }
    log('success', 'Looped all pagination links and add result into the All resturant links.');

    // Add all Results into the Data file
    // for (const link of allRestauranLinks) {
    //   fs.writeFile("data.txt", link);
    // }
    // log('success', 'Add all restaurant links into the data.txt.');


  } catch (error) {
    log('error', `Ooops! ${error.message}`)
  }

  // await browser.close();
}

main();