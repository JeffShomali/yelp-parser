const puppeteer = require('puppeteer');
var jsonfile = require('jsonfile')
var fs = require('fs')
var _ = require('lodash');




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
const BUSNIESSNAME = '#find_desc'; // serach fild
const LOCATION = '#dropperText_Mast'; // Location


async function run() {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage(); 
  await page.goto('http://yelp.com'); 
  console.log(`URL Loaded ${page.url()}`);



  

  
    
  

  
  

   
  
   
  
  
  // await browser.close();
}

run();