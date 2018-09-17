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
async function buinessNamesUrlsCleaner(urls) {
  const _t = []
  urls.map(a => {
    if (a.includes('yelp.com/biz')) _t.push(a.trim());
  })
  return _t
}

async function appendToTheFile(urls) {
  for (const link of urls) {
    fs.appendFileSync('url.txt', `${link}\n`);
  }
}

async function appendInformationIntoFile(obj) {
  fs.appendFileSync('data.txt', `${obj.title} - ${obj.address} - ${obj.website} - ${obj.phone}\n`);
}

async function parseData(url) {
  const browser = await puppeteer.launch({ timeout: 0});
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    Referer: 'https://yelp.com/'
  })

  try {
    await page.goto(url)
    log('success', `Opened ${url}`)

    // Get Title, Address, website and phone from Yelp
    let information = await page.evaluate(() => {
      const title = document.querySelector('a.biz-name.js-analytics-click>span').innerText.trim()
      const address = document.getElementsByTagName('address')[0].innerText.trim()
      const website = document.querySelector('span.biz-website.js-biz-website.js-add-url-tagging>a').innerText.trim()
      const phone = document.querySelector('span.biz-phone').innerText.trim();
      return {
        title,
        address,
        website,
        phone
      }
    })

    await appendInformationIntoFile(information)

  } catch (error) {
    log('error', `${error.message}`)
  }

  await browser.close();

}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
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
    let allRestauranLinks = []
    async function gotToEachPaginationLinksAndGetBusinessLinks(url) {
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        Referer: 'https://yelp.com/'
      })
      await page.goto(url, {
        timeout: 0
      })
      await page.waitForSelector('a.biz-name.js-analytics-click');

      let businessNames = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.biz-name.js-analytics-click'))
        return links.map(link => link.href)
      })

      let businessNamesLinksWithoutAds = await buinessNamesUrlsCleaner(businessNames)
      allRestauranLinks.push(...businessNamesLinksWithoutAds)
      log('success', 'Business names scrapped and trying to close this page.');
      await page.close();

    }

    //--------- Get all Business Links from each page
    for (const link of paginationUrls) {
      await gotToEachPaginationLinksAndGetBusinessLinks(link)
    }
    // await gotToEachPaginationLinksAndGetBusinessLinks(paginationUrls[0]) // just for testion
    log('success', 'Looped all pagination links and add result into the All resturant links array.');


    // Add all Results into the Data file
    await appendToTheFile(allRestauranLinks)
    log('success', 'Add all restaurant links into the data.txt.');


  } catch (error) {
    log('error', `Ooops! ${error.message}`)
  }

  // Read all paginations URL and extract information frm each URL
  var array = fs.readFileSync('url.txt').toString().split("\n");
  for(i in array) {
      await parseData(array[i]);
  }

  log('success', 'End of the program.')
  await browser.close()
}

main();