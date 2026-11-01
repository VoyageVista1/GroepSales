// Expliciete synthetische testdata, uitsluitend gebruikt door de testharness.
// Dit zijn geen Payload-documenten en geen kopie van productiegegevens.
const part = (id, label, price, perPerson = true, extra = {}) => ({id,label,price,perPerson,required:true,defaultSelected:true,available:true,...extra})
const trip = (id,title,country,price,rating,duration,maxTravellers,parts,extra={}) => ({
  id,catalogId:`catalog-${id}`,title,destination:country,country,price,rating,duration,maxTravellers,
  dates:'1 – 8 juni 2027',startDate:'2027-06-01',endDate:'2027-06-08',
  available:true,availabilityLabel:'Beschikbaar',description:'Synthetische QA-reis',
  facilities:['Verblijf inbegrepen'],parts,image:'/qa-image.svg',...extra,
})
export const travelProposals = [
  trip('portugal','QA Portugal','Portugal',445,4.5,7,8,[part('basis','Basispakket',406)]),
  trip('norway','QA Noorwegen','Noorwegen',997,4.8,7,20,[part('basis','Vlucht en verblijf',890),part('vast','Vaste kosten',135,false)],{remainingSpots:4}),
  trip('bali','QA Bali','Indonesië',600,4.9,10,20,[part('basis','Basispakket Bali',561)]),
  trip('italy','QA Italië','Italië',350,4.4,5,20,[part('basis','Basispakket Italië',311)]),
  trip('norway-alt','QA Noorwegen alternatief','Noorwegen',900,4.8,7,8,[part('basis','Alternatief pakket',861)]),
  trip('old','QA Archief','Portugal',400,4.6,7,8,[part('basis','Oud pakket',361)],{available:false,availabilityLabel:'Niet beschikbaar'}),
  trip('parts','QA Onderdeelconflict','Frankrijk',450,4.7,7,8,[part('basis','Uitverkocht hotel',411,true,{available:false,alternatives:[{label:'Beschikbaar vervangend hotel',price:421,available:true}]})]),
  trip('unrecoverable','QA Geen hotel','Duitsland',400,4.6,7,8,[part('basis','Onbeschikbaar hotel',361,true,{available:false})]),
]
export const customer={id:'qa-klant',name:'Zoë van Dijk',email:'zoe+qa@example.nl',phone:'0612345678',customerType:'private'}
export const personalMessage='QA 2026-11-01 — Zoë, dit persoonlijke bericht moet overal behouden blijven. '.repeat(8)
export function data(role='staff') { return {
  bookings:[],quotes:[],customers:[customer],travelWishes:{'qa-klant':{travellers:2,budget:'€ 2.000+',proposalId:'portugal'}},
  travelProposals,destinationFeeLabels:{},offerExtras:[
    {id:'transfer',label:'Transfer',price:54,perPerson:false,available:true},
    {id:'insurance',label:'Verzekering',price:29,perPerson:true,available:true},
  ],initialCustomerQuestions:[{id:'QA-VRAAG',customerId:customer.id,customerEmail:customer.email,
    subject:'QA aanvraag Noorwegen',category:'Reisvoorstel',channel:'Website',priority:'Normaal',status:'Nieuw',received:'Zojuist',unread:true,
    message:'Graag Noorwegen voor vier personen op de exacte testdatums.',destination:'Noorwegen',period:'1 – 8 juni 2027',travellers:'4 reizigers',
    budget:'€ 4.000',travelId:'norway',startDate:'2027-06-01',endDate:'2027-06-08',notes:[]}],
  favoriteTravelIds:[],user:{name:role==='staff'?'QA Medewerker':customer.name,email:role==='staff'?'staff@example.nl':customer.email,role},
} }
export const publicTrips=travelProposals.map(t=>({...t,id:t.catalogId,nights:t.duration,period:t.dates,imageAlt:t.title}))
