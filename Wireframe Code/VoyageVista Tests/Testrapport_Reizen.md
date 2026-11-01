# Testrapport Reizen

Nieuwe onafhankelijke testronde, 1 november 2026. **Het afrondcriterium is niet behaald: er staan blokkerende testbeperkingen open.** 0 bevestigde productafwijkingen in de uitgevoerde scope; een PASS hieronder geldt uitsluitend binnen de beschreven testopstelling.

| Gepland | Volledig uitgevoerd | PASS | FAIL | BLOCKED | NOT RUN |
|---:|---:|---:|---:|---:|---:|
| 15 | 14 | 14 | 0 | 1 | 0 |

Alle 15 gevallen zijn gestart. “Volledig uitgevoerd” telt PASS en FAIL; BLOCKED betekent dat de volledige voorgeschreven controle niet kon worden afgerond, ook als deelcontroles zijn aangetoond.

## Omgeving en beperkingen

Browser: Microsoft Edge 156.0.4314.58, Chromium headless op Windows. Viewports 1440×1000 en 390×844; locale nl-NL; timezone Europe/Berlin. React 19.3.1, Next.js 16.4.2, Payload 4.0.0-beta.4. Node v 24.12.0; dit ligt onder de package.json-eis>=24.22.1. Er zijn geen toolchainversies aangepast.

De resultaten gelden voor de echte React-schermen en CSS in een geïsoleerde browserharness met expliciete synthetische fixtures. Next.js-routerfuncties, next/image en serveracties zijn adapters; de beeldfixture is een SVG. Dit bewijst geen productiegedrag, Payload-opslag, authenticatie, echte media of cache-invalidering. Klantpreview en betalingsinformatie gebruiken herkenbaar ingespeelde offertedata/boekingsdata. Er is geen echte e-mail verstuurd en geen echte betaling uitgevoerd.

Niet uitgevoerd: andere browserengines(Firefox/WebKit), echte mobiele apparaten/touch, screenreader-audit, volledige WCAG-audit, platformauth/SSO, echte backendopslag en transacties, echte e-mail, echte betaalintegratie, mediaupload/vervanging, productiecachecontrole en productiebezoek. Er was geen bestaande testrapportage voor vergelijking; kritieke scenario’s zijn nieuw uitgevoerd, met gerichte hertests van de automatisering. Eerdere screenshots/PASS-resultaten uit docs zijn niet als bewijs gebruikt.

De echte lokale homepage geeft HTTP 500 door ontbrekende platformcontext: Environment ID could not be resolved. De loginpagina laadt en heeft lang=nl; /mijn-account stuurt zonder sessie naar /inloggen. Payload build strandt op dezelfde contextbeperking. De opdracht figma make verify-deploy is geprobeerd, maar figma is hier geen beschikbare executable. Er is dus geen productieroutetabel of productie-vrijgavebewijs. Zie [omgeving en blokkades](<Bevindingen_en_beperkingen.md>), [echte browserrooktest](<bewijs/live-browser-smoke.json>) en [buildlog](<bewijs/build.log>).

## Testmatrix

| ID | Techniek | Status |
|---|---|---|
| R-01 | Functioneel, equivalentieklassen | PASS |
| R-02 | Grenswaardeanalyse | PASS |
| R-03 | Grenswaardeanalyse | PASS |
| R-04 | Beslissingstabel | PASS |
| R-05 | Negatieve test | PASS |
| R-06 | Grenswaardeanalyse | PASS |
| R-07 | Functioneel | PASS |
| R-08 | Grenswaardeanalyse | PASS |
| R-09 | Integratie | PASS |
| R-10 | Beslissingstabel | PASS |
| R-11 | Persistentie, functioneel | BLOCKED |
| R-12 | Beslissingstabel | PASS |
| R-13 | Integratie | PASS |
| R-14 | Prijscontrole | PASS |
| R-15 | Responsiviteit | PASS |

## Bevindingen en hertestbare blokkades

- **R-11 — BLOCKED:** Bewaren en groepsgedrag in browser bewezen; duurzame opslag na herladen niet verifieerbaar zonder Payload. Bewijs: [log](<bewijs/R-11.json>), [screenshot](<bewijs/R-11.png>).

De volledige keten staat afzonderlijk in [End_to_end_rapport.md](<End_to_end_rapport.md>) en wordt niet dubbel meegeteld buiten testcase O-20.

## Dekking per techniek

| Techniek | Gevallen | PASS | FAIL | BLOCKED |
|---|---|---:|---:|---:|
| Functioneel | R-01, R-07 | 2 | 0 | 0 |
| equivalentieklassen | R-01 | 1 | 0 | 0 |
| Grenswaardeanalyse | R-02, R-03, R-06, R-08 | 4 | 0 | 0 |
| Beslissingstabel | R-04, R-10, R-12 | 3 | 0 | 0 |
| Negatieve test | R-05 | 1 | 0 | 0 |
| Integratie | R-09, R-13 | 2 | 0 | 0 |
| Persistentie | R-11 | 0 | 0 | 1 |
| functioneel | R-11 | 0 | 0 | 1 |
| Prijscontrole | R-14 | 1 | 0 | 0 |
| Responsiviteit | R-15 | 1 | 0 | 0 |

Een testcase met meerdere technieken komt in meerdere dekkingsrijen voor. De som van die rijen is daarom geen extra testcaseaantal.

## Registraties per testcase

## R-01 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Zoek op bestemming en combineer prijs- en beoordelingsfilters; alleen passende reizen verschijnen.

**Techniek:** Functioneel, equivalentieklassen.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:11 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Frisse stafsessie; expliciete catalogusfixture. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Portugal; maximum €500 p.p.; beoordeling ≥4,5.

**Reproductiestappen:**

1. Open Reizen. Kies Portugal.
2. Combineer maximumprijs €500 p.p. met beoordeling vanaf 4,5.
3. Lees de titels van alle resultaatkaarten. Alleen QA Portugal hoort over te blijven.

**Werkelijk resultaat:**

Filterresultaten: ["QA Portugal"]

**Status:** PASS.

**Bewijs:** [R-01.png](<bewijs/R-01.png>), [R-01.json](<bewijs/R-01.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-02 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Beoordeling precies op de minimumgrens wordt correct meegenomen.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:13 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Frisse catalogus. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** minimum 4,5 en 4,8; Portugal exact 4,5; Noorwegen exact 4,8.

**Reproductiestappen:**

1. Open Reizen en kies minimum 4,5. Controleer dat QA Portugal(4,5) wel en QA Italië(4,4) niet verschijnt.
2. Kies minimum 4,8. Controleer dat QA Noorwegen(4,8) wel en QA Portugal niet verschijnt.

**Werkelijk resultaat:**

Grensbeoordeling 4.5: ["QA Bali", "QA Noorwegen", "QA Noorwegen alternatief", "QA Onderdeelconflict", "QA Geen hotel", "QA Portugal"]

Inclusieve minimumgrens 4.5: {"ok":true}

Grensbeoordeling 4.8: ["QA Bali", "QA Noorwegen", "QA Noorwegen alternatief"]

Inclusieve minimumgrens 4.8: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-02.png](<bewijs/R-02.png>), [R-02.json](<bewijs/R-02.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-03 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Controleer resterende plaatsen: 4 reizigers bij 4 plaatsen toegestaan; 5 bij 4 plaatsen geweigerd.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:14 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen heeft 4 resterende plaatsen. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 4, 5, herstel 4 reizigers.

**Reproductiestappen:**

1. Open Reizen. Kies achtereenvolgens 4,5 en 4 reizigers.
2. Controleer dat QA Noorwegen met 4 resterende plaatsen bij 4 wel en bij 5 niet verschijnt.
3. Open bij 4 personen de details; Reis kiezen moet beschikbaar zijn.

**Werkelijk resultaat:**

Noorwegen zichtbaar bij 4: {"ok":true}

Noorwegen zichtbaar bij 5: {"ok":true}

Noorwegen zichtbaar bij 4: {"ok":true}

Exact 4 plaatsen selecteerbaar: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-03.png](<bewijs/R-03.png>), [R-03.json](<bewijs/R-03.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-04 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Gearchiveerde, niet-beschikbare en te kleine reizen kunnen niet worden geselecteerd.

**Techniek:** Beslissingstabel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:16 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Actuele en gearchiveerde records in fixture. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Archief; groep 9 bij max 8/resterend 4.

**Reproductiestappen:**

1. Open actueel aanbod; QA Archief mag niet voorkomen.
2. Open Oud aanbod, vervolgens QA Archief; Reis kiezen moet uitgeschakeld zijn.
3. Keer terug naar actueel aanbod. Kies 9 reizigers; Portugal(max 8) en Noorwegen(resterend 4) mogen niet verschijnen.

**Werkelijk resultaat:**

Archief uitgesloten van actueel: {"ok":true}

Niet beschikbare archiefreis onselecteerbaar: {"ok":true}

Te kleine reizen niet selecteerbaar via resultaten: {"ok":true, "actual":["QA Bali", "QA Italië"]}

**Status:** PASS.

**Bewijs:** [R-04.png](<bewijs/R-04.png>), [R-04.json](<bewijs/R-04.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-05 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Retourdatum vóór vertrekdatum toont een specifieke fout, niet uitsluitend 'geen resultaten'.

**Techniek:** Negatieve test.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:18 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Frisse catalogus. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** vertrek 2027-06-08; retour 2027-06-01; herstel retour 2027-06-08.

**Reproductiestappen:**

1. Open Reizen. Vul vertrek 8 juni 2027 en terug 1 juni 2027 in.
2. Controleer de specifieke datumfout en de afwezigheid van uitsluitend een leeg-resultatenmelding.
3. Corrigeer terug naar 8 juni; de datumfout moet verdwijnen.

**Werkelijk resultaat:**

Specifieke tekstfout bij omgekeerde datums: {"ok":true}

Geen misleidende lege resultaten: {"ok":true}

Fout herstelt na correctie: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-05.png](<bewijs/R-05.png>), [R-05.json](<bewijs/R-05.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-06 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Exacte vertrek- en retourdatums werken, inclusief datumgrenzen.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:19 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Exacte fixtureperiode 1–8 juni 2027. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** vertrek mei 31/juni 1/juni 2; retour juni 7/juni 8/juni 9.

**Reproductiestappen:**

1. Open Reizen met retour 8 juni 2027. Probeer vertrek 31 mei, 1 juni en 2 juni.
2. Alleen 1 juni mag QA Portugal opleveren.
3. Zet vertrek op 1 juni. Probeer retour 7,8 en 9 juni; alleen 8 juni mag de reis opleveren.

**Werkelijk resultaat:**

Vertrekgrens 2027-05-31: []

Exacte vertrekdatum toegepast: {"ok":true}

Vertrekgrens 2027-06-01: ["QA Noorwegen", "QA Noorwegen alternatief", "QA Onderdeelconflict", "QA Geen hotel", "QA Portugal", "QA Italië"]

Exacte vertrekdatum toegepast: {"ok":true}

Vertrekgrens 2027-06-02: []

Exacte vertrekdatum toegepast: {"ok":true}

Exacte retourgrens 2027-06-07: {"ok":true}

Exacte retourgrens 2027-06-08: {"ok":true}

Exacte retourgrens 2027-06-09: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-06.png](<bewijs/R-06.png>), [R-06.json](<bewijs/R-06.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-07 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Controleer alle sorteeropties op de daadwerkelijke volgorde.

**Techniek:** Functioneel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:21 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Frisse catalogus met verschillende prijzen/ratings/duur. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Alle vijf aangeboden sorteeropties.

**Reproductiestappen:**

1. Open Reizen zonder filters.
2. Kies achtereenvolgens aanbevolen, prijs laag–hoog, prijs hoog–laag, beoordeling en reisduur.
3. Vergelijk alle zeven titels per optie met de expliciete verwachte lijsten in de testcode en het log.

**Werkelijk resultaat:**

Werkelijke volgorde recommended: ["QA Bali", "QA Noorwegen", "QA Noorwegen alternatief", "QA Onderdeelconflict", "QA Geen hotel", "QA Portugal", "QA Italië"]

Werkelijke volgorde price-asc: ["QA Italië", "QA Geen hotel", "QA Portugal", "QA Onderdeelconflict", "QA Bali", "QA Noorwegen alternatief", "QA Noorwegen"]

Werkelijke volgorde price-desc: ["QA Noorwegen", "QA Noorwegen alternatief", "QA Bali", "QA Onderdeelconflict", "QA Portugal", "QA Geen hotel", "QA Italië"]

Werkelijke volgorde rating: ["QA Bali", "QA Noorwegen", "QA Noorwegen alternatief", "QA Onderdeelconflict", "QA Geen hotel", "QA Portugal", "QA Italië"]

Werkelijke volgorde duration: ["QA Italië", "QA Portugal", "QA Noorwegen", "QA Noorwegen alternatief", "QA Onderdeelconflict", "QA Geen hotel", "QA Bali"]

**Status:** PASS.

**Bewijs:** [R-07.png](<bewijs/R-07.png>), [R-07.json](<bewijs/R-07.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-08 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Maximaal drie reizen vergelijken; vierde selectie wordt geweigerd.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:23 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Minstens vier actuele reizen. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Selecteer eerste vier vergelijkingsvinkjes.

**Reproductiestappen:**

1. Open Reizen en vink de eerste drie reizen aan.
2. Controleer dat het vierde, nog niet gekozen vinkje is uitgeschakeld en het aantal op 3 blijft.
3. Open Vergelijk(3); controleer drie kolommen/reizen.

**Werkelijk resultaat:**

Vierde vinkje uitgeschakeld: {"ok":true}

Vierde selectie geweigerd; exact drie aangevinkt: {"ok":true, "checked":3}

Vergelijkingsdialoog bevat drie reizen: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-08.png](<bewijs/R-08.png>), [R-08.json](<bewijs/R-08.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-09 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Geselecteerde reis, datums, reizigers en klantcontext gaan correct mee naar Offerte maken.

**Techniek:** Integratie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:25 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Klantfixture en Noorwegenperiode beschikbaar. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Zoë; Noorwegen; 2 reizigers; 1–8 juni 2027.

**Reproductiestappen:**

1. Open Reizen. Selecteer Zoë van Dijk en open QA Noorwegen.
2. Klik Reis kiezen.
3. Controleer klant, reis, 2 reizigers, periode 1–8 juni 2027 en budget €2.000+ in de wizard.

**Werkelijk resultaat:**

Klant overgedragen: {"ok":true}

Aantal overgedragen: {"ok":true}

Reis overgedragen: {"ok":true}

Periode overgedragen: {"ok":true}

Budgetcontext behouden: {"ok":true}

Overgedragen samenvatting: "KLANT\nZoë van Dijk\nREIS\nQA Noorwegen\nREIZIGERS\n 2\nBUDGET\n € 2.000+\nTOTAAL\n € 1.993\nGecontroleerd"

**Status:** PASS.

**Bewijs:** [R-09.png](<bewijs/R-09.png>), [R-09.json](<bewijs/R-09.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-10 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Reis met maximum 8: groep van 8 toegestaan, 9 geweigerd; na correctie opnieuw controleren.

**Techniek:** Beslissingstabel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:27 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Portugal maximum 8. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 8→9→8 met controle en herstel.

**Reproductiestappen:**

1. Kies QA Portugal voor Zoë.
2. Wijzig in offertestap 1 het aantal naar 8,9 en 8; controleer respectievelijk toegang, blokkade en herstel.
3. Ga naar Reis, controleer opnieuw en ga naar Controle; genereren moet bereikbaar zijn.

**Werkelijk resultaat:**

Volgende stap bij 8 reizigers: {"ok":true}

Volgende stap bij 9 reizigers: {"ok":true}

Volgende stap bij 8 reizigers: {"ok":true}

Na herstel en nieuwe controle mag genereren: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-10.png](<bewijs/R-10.png>), [R-10.json](<bewijs/R-10.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-11 — BLOCKED

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Favoriet bewaren; na wijziging groepsgrootte volgt prijs actuele groep en aanvraag respecteert capaciteit.

**Techniek:** Persistentie, functioneel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:28 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Klantweergave; Noorwegen favoriet via mockadapter. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 2→3→5→4; max 4 resterend.

**Reproductiestappen:**

1. Open als klant QA Noorwegen en klik Selecteer deze reis en Bewaar favoriet. Leg de actieaanroep vast.
2. Omdat de adapter geen backend-reread doet: open een nieuwe harnesspagina met expliciet favoriteTravelIds=[norway]. Dit bewijst geen opslag.
3. Open de reis, wijzig groep naar 3, sluit en open Favorieten. Controleer €974 p.p.
4. Open favorietdetails. Zet groep op 5 en 4; aanvraag moet bij 5 blokkeren en na herstel 4 mogelijk zijn.
5. Duurzaam bewaren en herladen blijven geblokkeerd zonder Payload.

**Werkelijk resultaat:**

Bewaar favoriet roept actie aan: {"ok":true}

Geen echte reread: bekende bewaarde favoriet opnieuw ingespeeld voor groeps- en capaciteitstest

Favorietenprijs voor groep 3: "€ 974 p.p."

Favorietenprijs volgt groep 3: (890×3+135+117)/3=974: {"ok":true}

Aanvraag bij vijf geblokkeerd: {"ok":true}

Aanvraag na correctie vier mogelijk: {"ok":true}

**Beperking/afwijking:** Bewaren en groepsgedrag in browser bewezen; duurzame opslag na herladen niet verifieerbaar zonder Payload.

**Status:** BLOCKED.

**Bewijs:** [R-11.png](<bewijs/R-11.png>), [R-11.json](<bewijs/R-11.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## R-12 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Alternatieven voldoen aan actieve filters, capaciteit, datum en budget; anders duidelijke melding.

**Techniek:** Beslissingstabel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:30 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen resterend 4; alternatieven met dezelfde filters. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Noorwegen; 4 personen; exacte datums; max 1000 pp; rating 4,8; budget 4000.

**Reproductiestappen:**

1. Gebruik de expliciete R-12-fixture: klantbudget €4.000; archiefbeoordeling 4,8.
2. Filter op Noorwegen, 4 personen, 1–8 juni 2027, max €1.000 p.p. en rating 4,8. Open QA Noorwegen; alleen QA Noorwegen alternatief mag worden aangeboden.
3. Verlaag maximumprijs naar €750; verwacht geen resultaten.
4. Reset filters. Kies Portugal en Oud aanbod. Open QA Archief; alleen QA Portugal is een alternatief.
5. Sluit details, zet minimumrating op 4,8 en heropen QA Archief; verwacht een specifieke melding dat geen passend alternatief bestaat.

**Werkelijk resultaat:**

Passende alternatieven: ["QA Noorwegen alternatief"]

Geen reizen onder dit maximum: {"ok":true}

Archief toont uitsluitend actueel passend alternatief: {"ok":true}

Geen alternatief voldoet aan beoordelingsfilter: {"ok":true}

Duidelijke melding bij ontbreken alternatieven: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-12-met-alternatief.png](<bewijs/R-12-met-alternatief.png>), [R-12-archief-alternatief.png](<bewijs/R-12-archief-alternatief.png>), [R-12.png](<bewijs/R-12.png>), [R-12.json](<bewijs/R-12.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-13 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Overdracht vanuit Klantvragen bewaart klant, bestemming, aantal, datums en budget.

**Techniek:** Integratie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:33 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Klantvraagfixture met eigen budget/datum/aantal. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** QA-VRAAG; Zoë; Noorwegen; 4; 1–8 juni; €4000.

**Reproductiestappen:**

1. Open Klantvragen en selecteer QA aanvraag Noorwegen.
2. Klik Reis zoeken. Controleer klant-ID, bestemming, 4 reizigers, vertrek 1 juni, retour 8 juni en budget €4.000.
3. Open QA Noorwegen en kies de reis; controleer aantal en aanvraagbudget ook in Offerte maken.

**Werkelijk resultaat:**

Klant-id behouden: {"ok":true}

Bestemming behouden: {"ok":true}

Aantal behouden: {"ok":true}

Vertrek behouden: {"ok":true}

Retour behouden: {"ok":true}

Aanvraagbudget behouden: {"ok":true}

Aantal ook in offerte behouden: {"ok":true}

Aanvraagbudget ook in offerte behouden: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-13.png](<bewijs/R-13.png>), [R-13.json](<bewijs/R-13.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-14 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Catalogus, details en offerte tonen consistente groepsprijs; controleer Noorwegen voor 2 (€1.993) met juiste mockdata.

**Techniek:** Prijscontrole.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:35 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Expliciete Noorwegen-prijsfixture:890 pp+135 vast+39 pp. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Groep 2:1780+135+78=1993.

**Reproductiestappen:**

1. Open Reizen met 2 personen. Controleer QA Noorwegen:€997 p.p., €1.993 groepsprijs.
2. Open details; totale reissom moet €1.993 zijn.
3. Kies de reis; controleer ook €1.993 in de offertecontext.

**Werkelijk resultaat:**

Catalogusprijs: "Vergelijken\nvanaf · incl. BTW\n € 997 p.p.\n € 1.993 totaal voor 2\nBekijk reis"

Catalogus groepprijs 1993: {"ok":true}

Detailprijs 1993: {"ok":true}

Offerteprijs 1993: {"ok":true}

**Status:** PASS.

**Bewijs:** [R-14.png](<bewijs/R-14.png>), [R-14.json](<bewijs/R-14.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## R-15 — PASS

**Pagina/functionaliteit:** Reizen.

**Doel en verwacht resultaat:** Filters, detailacties en vergelijkingsknoppen blijven bereikbaar op desktop en mobiel.

**Techniek:** Responsiviteit.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:36 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Desktop en mobiel; vier vergelijkingen beschikbaar. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 1440×1000; 390×844.

**Reproductiestappen:**

1. Open Reizen op 1440×1000 en herhaal op 390×844.
2. Scroll alle zoekvelden in beeld. Vink een vergelijking aan en breng de vergelijkingsactie in beeld.
3. Open QA Portugal. Scroll Reis kiezen in beeld en meet dat de hele knop binnen de viewport valt.
4. Controleer documentbreedte en maak per viewport een screenshot.

**Werkelijk resultaat:**

Geen pagina-overloop op 1440: {"ok":true}

Detailactie volledig in viewport: {"ok":true, "actionBounds":{"x":1166.5, "y":938, "width":235.5, "height":44}}

Geen pagina-overloop op 390: {"ok":true}

Detailactie volledig in viewport: {"ok":true, "actionBounds":{"x":201.5, "y":790, "width":164.5, "height":50}}

**Status:** PASS.

**Bewijs:** [R-15-1440.png](<bewijs/R-15-1440.png>), [R-15-390.png](<bewijs/R-15-390.png>), [R-15.png](<bewijs/R-15.png>), [R-15.json](<bewijs/R-15.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

