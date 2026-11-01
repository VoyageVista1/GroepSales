// De echte React-schermen en CSS; Next.js adapters en backendacties zijn vervangen.
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const esbuild=require('../../node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild')
const postcss=require('postcss'),tailwind=require('@tailwindcss/postcss')
export async function startHarness(){
 const root=process.cwd().replaceAll('\\','/'),out=path.resolve('VoyageVista Tests/harness/generated')
 fs.mkdirSync(out,{recursive:true})
 const adapters={name:'qa-adapters',setup(build){
  build.onResolve({filter:/^(@\/actions\/|next\/)/},args=>({path:args.path,namespace:'qa'}))
  build.onLoad({filter:/.*/,namespace:'qa'},args=>{
   if(args.path==='next/navigation')return {contents:'export const useRouter=()=>({refresh(){window.__refreshes=(window.__refreshes||0)+1}})'}
   if(args.path==='next/image')return {contents:`import React from 'react';export default function Image({fill,priority,style,...props}){return React.createElement('img',{...props,style:fill?{position:'absolute',inset:0,width:'100%',height:'100%',...style}:style})}`,resolveDir:process.cwd()}
   if(args.path==='next/link')return {contents:`import React from 'react';export default function Link(props){return React.createElement('a',props)}`,resolveDir:process.cwd()}
   if(args.path==='@/actions/navigation')return {contents:'export const getNavigationRole=async()=>null'}
   const names=args.path.endsWith('/auth')?['loginAction','registerAction','logoutAction']:['bookTripAction','acceptQuoteAction','addQuestionMessageAction','createQuestionAction','saveBookingAction','saveCustomerAction','saveQuoteAction','toggleFavoriteAction','updateQuestionAction']
   return {contents:names.map(n=>`export const ${n}=async(...args)=>{window.__calls.push({name:'${n}',args}); if(window.__failStorage==='throw')throw new Error('QA storage transport failure'); if(window.__failStorage)return {ok:false,message:'QA: opslag tijdelijk onbeschikbaar. Probeer opnieuw.'}; return {ok:true,message:'QA-adapter: geen echte opslag',reference:'qa-reference'};}`).join('\n')}
  })
 }}
 const entry=`import React from 'react';import{createRoot}from'react-dom/client';
 import App from '${root}/src/app/(frontend)/VoyageVista';
 import ErrorBoundary from '${root}/src/app/(frontend)/ErrorBoundary';
 import{data,publicTrips}from '${root}/VoyageVista Tests/harness/fixtures.mjs';
 window.__calls=[];const params=new URLSearchParams(location.search),role=params.get('role')||'staff';
 const input=data(role);if(window.__inputOverrides)Object.assign(input,window.__inputOverrides);
 function Fault(){throw new Error('QA: bewust veroorzaakte renderfout')}
 window.__renderFault=()=>root.render(<ErrorBoundary><Fault/></ErrorBoundary>);
 const root=createRoot(document.getElementById('root'));root.render(<ErrorBoundary><App data={input} trips={publicTrips}/></ErrorBoundary>);window.__qaInput=input;`
 await esbuild.build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},outfile:path.join(out,'app.js'),bundle:true,jsx:'automatic',plugins:[adapters],define:{'process.env.NODE_ENV':'"development"'}})
 const cssPath=path.resolve('src/app/(frontend)/styles.css')
 const css=await postcss([tailwind({base:process.cwd()})]).process(fs.readFileSync(cssPath,'utf8'),{from:cssPath})
 fs.writeFileSync(path.join(out,'styles.css'),css.css)
 const html='<!doctype html><html lang="nl"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>'
 const server=http.createServer((req,res)=>{
  const file=req.url.split('?')[0]
  if(file==='/app.js'||file==='/styles.css'){res.setHeader('content-type',file.endsWith('.js')?'application/javascript':'text/css');res.end(fs.readFileSync(path.join(out,file.slice(1))));return}
  if(file==='/qa-image.svg'){res.setHeader('content-type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="#85b7b5"/><path fill="#416e69" d="M0 800 800 100 1600 800v200H0z"/></svg>');return}
  res.setHeader('content-type','text/html;charset=utf-8');res.end(html)
 })
 await new Promise(r=>server.listen(0,'127.0.0.1',r))
 return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))}
}
