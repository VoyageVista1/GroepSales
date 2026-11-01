// Alleen lezen van echte lokale Next.js-routes, zonder inloggegevens.
import fs from 'node:fs'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url)
const {chromium}=require('C:/Users/xudes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'nl-NL'})
const page=await context.newPage(),results=[]
try{
 for(const route of ['/','/inloggen','/mijn-account']){
  const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener)
  const result={route,date:new Date().toISOString()}
  try{
   const response=await page.goto('http://127.0.0.1:3000'+route,{waitUntil:'networkidle',timeout:25000})
   result.status=response?.status();result.finalURL=page.url();result.lang=await page.locator('html').getAttribute('lang')
   result.visibleText=(await page.locator('body').innerText()).slice(0,5000)
   result.screenshot=`live-${route.replaceAll('/','')||'home'}.png`
   await page.screenshot({path:'VoyageVista Tests/bewijs/'+result.screenshot,fullPage:true})
  }catch(e){result.error=e.message}
  result.pageErrors=errors;page.off('pageerror',listener);results.push(result)
 }
}finally{fs.writeFileSync('VoyageVista Tests/bewijs/live-browser-smoke.json',JSON.stringify(results,null,2));await browser.close()}
