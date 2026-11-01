# VoyageVista Tests

Uitvoering van VoyageVista_Testmethodiek.md op 1 november 2026. **34 PASS, 0 FAIL, 7 BLOCKED, 0 NOT RUN.** Alle 41 gevallen zijn gestart; 34 zijn volledig uitgevoerd binnen de geïsoleerde browseropstelling. Het afrondcriterium is niet behaald door open testblokkades.

| Rapport | Gepland | Volledig uitgevoerd | PASS | FAIL | BLOCKED | NOT RUN |
|---|---:|---:|---:|---:|---:|---:|
| [Reizen](<Testrapport_Reizen.md>) |15|14|14|0|1|0|
| [Offerte maken](<Testrapport_Offerte_maken.md>) |26|20|20|0|6|0|
| Totaal |41|34|34|0|7|0|

De [volledige mockklantreis](<End_to_end_rapport.md>) staat apart beschreven en is BLOCKED. [Bevindingen en beperkingen](<Bevindingen_en_beperkingen.md>) bevat de exacte blokkades en hertestvolgorde. [Testregistratie.json](<Testregistratie.json>) bevat alle 41 complete registraties; [bewijs](<bewijs/>) bevat screenshots, logs en de gedownloade demonstratiebestanden.

De browsercontroles gebruiken echte appcomponenten/CSS met synthetische fixtures en adapters voor Next.js/backendacties. De echte lokale homepage en build blokkeren door ontbrekende Figma-platformcontext. Er is geen productie-vrijgave of bewijs van duurzame opslag. Er zijn geen echte mails of betalingen uitgevoerd.

## Opnieuw uitvoeren

Vanuit de projectmap:

~~~powershell
node "VoyageVista Tests/harness/run.mjs"
node "VoyageVista Tests/harness/report.mjs"
~~~

De harness bouwt de bestaande appschermen, opent Microsoft Edge headless op een tijdelijke localhostpoort, maakt per testcase een lege browsercontext en sluit browser/server na afloop. Er worden geen Payload-documenten gewijzigd. De scripts gebruiken de reeds lokaal beschikbare esbuild- en Playwright-installaties; de paden staan in server.mjs en run.mjs. De echte rooktest is apart reproduceerbaar met live-smoke.mjs wanneer de bestaande Next.js-server draait.

Fixtureverantwoording: QA Noorwegen gebruikt €890 p.p.+€135 vast+€39 servicep.p.=€1.993 voor 2; QA Portugal gebruikt €406 p.p.+€39 servicep.p.=€890 voor 2. Deze expliciete testsommen zijn geen verklaring over bestaande Payload-records. Testmethode en bronversie: [bronplan](<Testmethodiek_bron.md>), [SHA-256/omgeving](<bewijs/omgeving.json>).

Aanvullend zijn de typecheck(exit 0) en 24 bestaande regressietests(24 PASS) opnieuw uitgevoerd; deze zijn niet bij de 41 planresultaten opgeteld. Broncode onder src is niet gewijzigd.

## Bewijsversies

De definitieve volledige uitvoering staat in [browser-definitief.log](<bewijs/browser-definitief.log>). Oudere browser-run-/hertestlogs zijn diagnostiek van de automatisering. Daarin staan gecorrigeerde selectortime-outs; die zijn geen bevestigde applicatiebugs. De rapporten en JSON-registraties gebruiken uitsluitend de laatste uitvoering per testcase.
