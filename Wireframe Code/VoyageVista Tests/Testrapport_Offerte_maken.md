# Testrapport Offerte maken

Nieuwe onafhankelijke testronde, 1 november 2026. **Het afrondcriterium is niet behaald: er staan blokkerende testbeperkingen open.** 0 bevestigde productafwijkingen in de uitgevoerde scope; een PASS hieronder geldt uitsluitend binnen de beschreven testopstelling.

| Gepland | Volledig uitgevoerd | PASS | FAIL | BLOCKED | NOT RUN |
|---:|---:|---:|---:|---:|---:|
| 26 | 20 | 20 | 0 | 6 | 0 |

Alle 26 gevallen zijn gestart. “Volledig uitgevoerd” telt PASS en FAIL; BLOCKED betekent dat de volledige voorgeschreven controle niet kon worden afgerond, ook als deelcontroles zijn aangetoond.

## Omgeving en beperkingen

Browser: Microsoft Edge 156.0.4314.58, Chromium headless op Windows. Viewports 1440×1000 en 390×844; locale nl-NL; timezone Europe/Berlin. React 19.3.1, Next.js 16.4.2, Payload 4.0.0-beta.4. Node v 24.12.0; dit ligt onder de package.json-eis>=24.22.1. Er zijn geen toolchainversies aangepast.

De resultaten gelden voor de echte React-schermen en CSS in een geïsoleerde browserharness met expliciete synthetische fixtures. Next.js-routerfuncties, next/image en serveracties zijn adapters; de beeldfixture is een SVG. Dit bewijst geen productiegedrag, Payload-opslag, authenticatie, echte media of cache-invalidering. Klantpreview en betalingsinformatie gebruiken herkenbaar ingespeelde offertedata/boekingsdata. Er is geen echte e-mail verstuurd en geen echte betaling uitgevoerd.

Niet uitgevoerd: andere browserengines(Firefox/WebKit), echte mobiele apparaten/touch, screenreader-audit, volledige WCAG-audit, platformauth/SSO, echte backendopslag en transacties, echte e-mail, echte betaalintegratie, mediaupload/vervanging, productiecachecontrole en productiebezoek. Er was geen bestaande testrapportage voor vergelijking; kritieke scenario’s zijn nieuw uitgevoerd, met gerichte hertests van de automatisering. Eerdere screenshots/PASS-resultaten uit docs zijn niet als bewijs gebruikt.

De echte lokale homepage geeft HTTP 500 door ontbrekende platformcontext: Environment ID could not be resolved. De loginpagina laadt en heeft lang=nl; /mijn-account stuurt zonder sessie naar /inloggen. Payload build strandt op dezelfde contextbeperking. De opdracht figma make verify-deploy is geprobeerd, maar figma is hier geen beschikbare executable. Er is dus geen productieroutetabel of productie-vrijgavebewijs. Zie [omgeving en blokkades](<Bevindingen_en_beperkingen.md>), [echte browserrooktest](<bewijs/live-browser-smoke.json>) en [buildlog](<bewijs/build.log>).

## Testmatrix

| ID | Techniek | Status |
|---|---|---|
| O-01 | Equivalentieklassen | PASS |
| O-02 | Negatieve test | PASS |
| O-03 | Grenswaardeanalyse | PASS |
| O-04 | Beslissingstabel | PASS |
| O-05 | Toestandsovergang | BLOCKED |
| O-06 | Grenswaardeanalyse | PASS |
| O-07 | Equivalentieklassen | PASS |
| O-08 | Negatieve test | BLOCKED |
| O-09 | Prijscontrole | PASS |
| O-10 | Prijscontrole | PASS |
| O-11 | Prijscontrole | PASS |
| O-12 | Prijscontrole | PASS |
| O-13 | Functioneel | BLOCKED |
| O-14 | Functioneel | PASS |
| O-15 | Negatieve test | PASS |
| O-16 | Persistentie | BLOCKED |
| O-17 | Integratie | PASS |
| O-18 | Persistentie | BLOCKED |
| O-19 | Integratie | PASS |
| O-20 | End-to-end | BLOCKED |
| O-21 | Toegankelijkheid | PASS |
| O-22 | Toegankelijkheid | PASS |
| O-23 | Toegankelijkheid | PASS |
| O-24 | Responsiviteit | PASS |
| O-25 | Foutafhandeling | PASS |
| O-26 | Foutafhandeling | PASS |

## Bevindingen en hertestbare blokkades

- **O-05 — BLOCKED:** Controle is synchroon in huidige implementatie; er bestaat geen lopende/asynchrone checking-toestand om de voorgeschreven raceconditie uit te voeren. Invalidering na wijziging wel bewezen. Bewijs: [log](<bewijs/O-05.json>), [screenshot](<bewijs/O-05.png>).
- **O-08 — BLOCKED:** Blokkade van doorgaan, controleren en bereiken van genereren plus herstel bewezen. Belastingvalidatie bij Prijs bevestigen niet uitvoerbaar: de huidige app biedt deze toestand niet aan. Bewijs: [log](<bewijs/O-08.json>), [screenshot](<bewijs/O-08.png>).
- **O-13 — BLOCKED:** Bali activeert in de huidige app geen mockprijswijziging; controle gaat rechtstreeks naar geldig. Het voorgeschreven +€24 p.p.-scenario is niet bereikbaar. Er is geen alternatieve prijsupdatefixture geïnjecteerd. Bewijs: [log](<bewijs/O-13.json>), [screenshot](<bewijs/O-13.png>).
- **O-16 — BLOCKED:** Vorige/Volgende, save-payload en heropenen bewezen. Reloadpersistentie van opgeslagen bericht niet verifieerbaar: backendacties zijn expliciete adapters zonder opslag. Bewijs: [log](<bewijs/O-16.json>), [screenshot](<bewijs/O-16.png>).
- **O-18 — BLOCKED:** Echte opslag en opnieuw ophalen van offerteconcepten vereist Figma/Payload-context; die ontbreekt lokaal (Environment ID could not be resolved). Geen vals persistentieresultaat uit de adapter afgeleid. Bewijs: [log](<bewijs/O-18.json>), [screenshot](<bewijs/O-18.png>).
- **O-20 — BLOCKED:** Gedeeltelijke mockflow bewezen. Klantoverdracht en boeking expliciet ingespeeld, niet door echte backend aangemaakt. Volledige keten en voorbeeldbetaling geblokkeerd: geen Figma/Payload-context en betaalprovider/mockbetaalactie ontbreekt. Bewijs: [log](<bewijs/O-20.json>), [screenshot](<bewijs/O-20.png>).

De volledige keten staat afzonderlijk in [End_to_end_rapport.md](<End_to_end_rapport.md>) en wordt niet dubbel meegeteld buiten testcase O-20.

## Dekking per techniek

| Techniek | Gevallen | PASS | FAIL | BLOCKED |
|---|---|---:|---:|---:|
| Equivalentieklassen | O-01, O-07 | 2 | 0 | 0 |
| Negatieve test | O-02, O-08, O-15 | 2 | 0 | 1 |
| Grenswaardeanalyse | O-03, O-06 | 2 | 0 | 0 |
| Beslissingstabel | O-04 | 1 | 0 | 0 |
| Toestandsovergang | O-05 | 0 | 0 | 1 |
| Prijscontrole | O-09, O-10, O-11, O-12 | 4 | 0 | 0 |
| Functioneel | O-13, O-14 | 1 | 0 | 1 |
| Persistentie | O-16, O-18 | 0 | 0 | 2 |
| Integratie | O-17, O-19 | 2 | 0 | 0 |
| End-to-end | O-20 | 0 | 0 | 1 |
| Toegankelijkheid | O-21, O-22, O-23 | 3 | 0 | 0 |
| Responsiviteit | O-24 | 1 | 0 | 0 |
| Foutafhandeling | O-25, O-26 | 2 | 0 | 0 |

Een testcase met meerdere technieken komt in meerdere dekkingsrijen voor. De som van die rijen is daarom geen extra testcaseaantal.

## Registraties per testcase

## O-01 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Ongeldige e-mailadressen geweigerd; geldig adres met plus-adressering toegestaan.

**Techniek:** Equivalentieklassen.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:40 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Nieuwe offerte en nieuwe klant-formulier. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** geen-at; a@b; a@@b.nl; a b@c.nl; zoe+qa@example.nl.

**Reproductiestappen:**

1. Open Offertes→Nieuwe offerte→Nieuwe klant toevoegen. Vul naam en telefoon geldig in.
2. Probeer geen-at, a@b, a@@b.nl, a b@c.nl; verwacht fouttekst en geblokkeerd toevoegen.
3. Corrigeer naar zoe+qa@example.nl; toevoegen moet mogelijk zijn en de actie moet het adres behouden.

**Werkelijk resultaat:**

E-mailvalidatie geen-at: {"ok":true}

Fouttekst zichtbaar: {"ok":true}

E-mailvalidatie a@b: {"ok":true}

Fouttekst zichtbaar: {"ok":true}

E-mailvalidatie a@@b.nl: {"ok":true}

Fouttekst zichtbaar: {"ok":true}

E-mailvalidatie a b@c.nl: {"ok":true}

Fouttekst zichtbaar: {"ok":true}

E-mailvalidatie zoe+qa@example.nl: {"ok":true}

Plus-adressering bereikt actieadapter: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-01.png](<bewijs/O-01.png>), [O-01.json](<bewijs/O-01.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-02 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Naam en telefoon na trimmen niet leeg; Unicode-naam toegestaan.

**Techniek:** Negatieve test.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:42 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Nieuw klantformulier. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** naam/spaties; telefoon/spaties; Unicode Zoë 李.

**Reproductiestappen:**

1. Open het nieuwe-klantformulier; vul een geldig e-mailadres in.
2. Probeer naam met alleen spaties en daarna telefoon met alleen spaties; toevoeging moet blokkeren.
3. Gebruik naam “ Zoë 李 ” en telefoon “ 06123 ”. Voeg toe en inspecteer de getrimde actiegegevens.

**Werkelijk resultaat:**

Trimvalidatie {"name":"   ", "phone":"06123"}: {"ok":true}

Trimvalidatie {"name":"Zoë 李", "phone":"   "}: {"ok":true}

Trimvalidatie {"name":" Zoë 李 ", "phone":" 06123 "}: {"ok":true}

Unicode geaccepteerd en waarden getrimd: {"ok":true, "actual":{"name":"Zoë 李", "email":"zoe+qa@example.nl", "phone":"06123", "id":"qa-reference"}}

**Status:** PASS.

**Bewijs:** [O-02.png](<bewijs/O-02.png>), [O-02.json](<bewijs/O-02.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-03 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Reizigers: leeg, 0, 1, 2, 19, 20, 21, 1,5. Alleen gehele waarden 1–20 zijn invoertechnisch geldig.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:44 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Bali capaciteit 20; geselecteerde klant. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** leeg, 0,1,2,19,20,21,1.5.

**Reproductiestappen:**

1. Kies QA Bali voor Zoë; capaciteit 20.
2. Vul achtereenvolgens leeg, 0,1,2,19,20,21 en 1.5 in.
3. Controleer aria-invalid en Volgende stap; alleen gehele 1–20 zijn geldig. Corrigeer naar 2.

**Werkelijk resultaat:**

Invoervalidatie aantal "": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":""}

Invoervalidatie aantal "0": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"0"}

Invoervalidatie aantal "1": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"1"}

Invoervalidatie aantal "2": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"2"}

Invoervalidatie aantal "19": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"19"}

Invoervalidatie aantal "20": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"20"}

Invoervalidatie aantal "21": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"21"}

Invoervalidatie aantal "1.5": {"ok":true}

Veldfoutstatus correct: {"ok":true, "value":"1.5"}

Herstel geldig aantal: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-03.png](<bewijs/O-03.png>), [O-03.json](<bewijs/O-03.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-04 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Ook geldig reizigersaantal moet passen binnen capaciteit van gekozen reis.

**Techniek:** Beslissingstabel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:45 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen resterend 4. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 4,5, herstel 4.

**Reproductiestappen:**

1. Kies QA Noorwegen voor Zoë.
2. Wijzig aantal naar 4,5 en 4. Bij 5 moet een specifieke capaciteitsfout voortgang blokkeren.
3. Controleer na herstel opnieuw en ga naar de generatiestap.

**Werkelijk resultaat:**

Capaciteitscontrole 4: {"ok":true}

Capaciteitscontrole 5: {"ok":true}

Capaciteitsfouttekst: {"ok":true}

Capaciteitscontrole 4: {"ok":true}

Nieuwe controle na herstel: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-04.png](<bewijs/O-04.png>), [O-04.json](<bewijs/O-04.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-05 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Wijzig groepsgrootte tijdens lopende beschikbaarheidscontrole; verouderde uitkomst mag niet worden gebruikt.

**Techniek:** Toestandsovergang.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:47 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Beschikbaarheidscontrole en wijzigbaar aantal. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 2→9→2 tijdens/na controle.

**Reproductiestappen:**

1. Kies QA Portugal en voer Nu controleren uit.
2. Ga terug naar Klant, wijzig aantal van 2 naar 9 en controleer blokkade.
3. Corrigeer naar 2, ga naar Reis; oude geldigheid mag niet hergebruikt worden. Controleer opnieuw.
4. Een wijziging tijdens een lopende controle kan niet worden uitgevoerd: de huidige controle is synchroon.

**Werkelijk resultaat:**

Nieuwe ongeldige groep gebruikt oude geldigheid niet: {"ok":true}

Ook na herstel opnieuw controleren vereist: {"ok":true}

Nieuwe controle maakt voortgang mogelijk: {"ok":true}

**Beperking/afwijking:** Controle is synchroon in huidige implementatie; er bestaat geen lopende/asynchrone checking-toestand om de voorgeschreven raceconditie uit te voeren. Invalidering na wijziging wel bewezen.

**Status:** BLOCKED.

**Bewijs:** [O-05.png](<bewijs/O-05.png>), [O-05.json](<bewijs/O-05.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-06 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** BTW: -0,1; 0; 0,05; 0,1; 29,9; 30; 30,1. Alleen 0–30 met stap 0,1 geldig.

**Techniek:** Grenswaardeanalyse.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:49 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Zakelijke boeking maakt BTW-invoer zichtbaar. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** -0.1; 0; 0.05; 0.1; 29.9; 30; 30.1.

**Reproductiestappen:**

1. Kies QA Portugal en zet Boekingstype op Zakelijk. Ga naar Reis.
2. Probeer BTW-waarden-0.1,0,0.05,0.1,29.9,30,30.1.
3. Controleer tekst/aria-invalid en de controleknop. Corrigeer naar 21 en ga verder.

**Werkelijk resultaat:**

BTW-grens -0.1: {"ok":true}

Controle blokkeren bij BTW -0.1: {"ok":true}

BTW-grens 0: {"ok":true}

Controle blokkeren bij BTW 0: {"ok":true}

BTW-grens 0.05: {"ok":true}

Controle blokkeren bij BTW 0.05: {"ok":true}

BTW-grens 0.1: {"ok":true}

Controle blokkeren bij BTW 0.1: {"ok":true}

BTW-grens 29.9: {"ok":true}

Controle blokkeren bij BTW 29.9: {"ok":true}

BTW-grens 30: {"ok":true}

Controle blokkeren bij BTW 30: {"ok":true}

BTW-grens 30.1: {"ok":true}

Controle blokkeren bij BTW 30.1: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-06.png](<bewijs/O-06.png>), [O-06.json](<bewijs/O-06.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-07 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Lokale heffing: leeg toegestaan, negatieve waarden geweigerd, niet-negatief met stap 0,1; geen nieuw maximum aannemen.

**Techniek:** Equivalentieklassen.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:51 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Lokale tariefinvoer zonder maximum. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** leeg; -0.1; 0; 0.05; 0.1; 10000.1.

**Reproductiestappen:**

1. Kies QA Portugal, ga naar Reis.
2. Probeer lokale heffing leeg, -0.1,0,0.05,0.1,10000.1.
3. Controleer fouten en controleblokkade; leeg en niet-negatieve stappen 0.1 zijn geldig. Controleer dat geen max-attribuut bestaat.
4. Maak het veld leeg en doorloop controle en voortgang.

**Werkelijk resultaat:**

Lokale heffing "": {"ok":true}

Controleblokkade lokaal : {"ok":true}

Lokale heffing "-0.1": {"ok":true}

Controleblokkade lokaal -0.1: {"ok":true}

Lokale heffing "0": {"ok":true}

Controleblokkade lokaal 0: {"ok":true}

Lokale heffing "0.05": {"ok":true}

Controleblokkade lokaal 0.05: {"ok":true}

Lokale heffing "0.1": {"ok":true}

Controleblokkade lokaal 0.1: {"ok":true}

Lokale heffing "10000.1": {"ok":true}

Controleblokkade lokaal 10000.1: {"ok":true}

Geen nieuw maximum ingesteld: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-07.png](<bewijs/O-07.png>), [O-07.json](<bewijs/O-07.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-08 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Ongeldige belasting blokkeert doorgaan, controleren, bevestigen en genereren met begrijpelijke melding.

**Techniek:** Negatieve test.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:53 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Zakelijke offerte; stap 2. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** BTW 30.1; heffing-0.1; herstel 21/leeg.

**Reproductiestappen:**

1. Kies QA Portugal zakelijk en ga naar Reis.
2. Vul eerst BTW 30.1 en daarna lokale heffing-0.1 in. Controleer fouttekst, geblokkeerde controle/doorgaan en onbereikbaar genereren.
3. Herstel naar 21/leeg en controleer dat genereren bereikbaar wordt.
4. De controle bij Prijs bevestigen is geblokkeerd: die toestand wordt niet aangeboden.

**Werkelijk resultaat:**

Ongeldige belasting blokkeert doorgaan: {"ok":true}

Ongeldige belasting blokkeert controleren: {"ok":true}

Genereren onbereikbaar bij ongeldige belasting: {"ok":true}

Begrijpelijke belastingmelding: {"ok":true}

Ongeldige belasting blokkeert doorgaan: {"ok":true}

Ongeldige belasting blokkeert controleren: {"ok":true}

Genereren onbereikbaar bij ongeldige belasting: {"ok":true}

Begrijpelijke belastingmelding: {"ok":true}

Herstel geeft toegang tot genereren: {"ok":true}

Prijs bevestigen ontbreekt: huidige app biedt geen prijswijzigingstoestand

**Beperking/afwijking:** Blokkade van doorgaan, controleren en bereiken van genereren plus herstel bewezen. Belastingvalidatie bij Prijs bevestigen niet uitvoerbaar: de huidige app biedt deze toestand niet aan.

**Status:** BLOCKED.

**Bewijs:** [O-08.png](<bewijs/O-08.png>), [O-08.json](<bewijs/O-08.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-09 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Basisprijs, vaste kosten, kosten per persoon, extra's, prijsaanpassingen en €39 servicekosten p.p. correct verwerkt.

**Techniek:** Prijscontrole.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:55 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen; 2 personen; extra 54 vast+29 pp. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 1780+135+54+58+78=2105; aparte prijsaanpassing 48.

**Reproductiestappen:**

1. Kies QA Noorwegen 2. Selecteer Transfer €54 vast en Verzekering €29 p.p.
2. Controleer reissom €2.105:€1.780 basis+€135 vast+€112 extras+€78 service.
3. Voer ook de echte prijsfunctie uit met groepsprijsaanpassing €48; verwacht €2.153. Deze functieaanroep bewijst geen prijswijzigingstrigger in de wizard.

**Werkelijk resultaat:**

Groepprijs bevat basis, vaste kosten, extras en service: {"ok":true}

Uitgevoerde pure prijsfunctie inclusief aanpassing: {"partsTotal":1915, "extrasTotal":112, "serviceCosts":78, "totalPrice":2153}

Prijsaanpassing direct via echte prijsfunctie getest; wizardtrigger apart O-13

**Status:** PASS.

**Bewijs:** [O-09.png](<bewijs/O-09.png>), [O-09.json](<bewijs/O-09.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-10 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Exacte groepsprijs wordt berekend vóór afronding van getoonde p.p.-prijs.

**Techniek:** Prijscontrole.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:57 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen 2 met half-euro p.p.. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 1993/2=996.5; weergave 997 pp; totaal 1993.

**Reproductiestappen:**

1. Open Reizen met 2 personen en bekijk QA Noorwegen.
2. Controleer dat de afgeronde p.p.-prijs €997 is maar de groep €1.993 kost.
3. Voer de echte prijsfunctie uit; de groepsprijs mag niet €1.994 worden door p.p.-afronding vooraf.

**Werkelijk resultaat:**

Prijsweergave: "Vergelijken\nvanaf · incl. BTW\n € 997 p.p.\n € 1.993 totaal voor 2\nBekijk reis"

Groepprijs niet afgeleid van afgeronde pp-prijs: {"ok":true}

Exacte groepberekening 1993: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-10.png](<bewijs/O-10.png>), [O-10.json](<bewijs/O-10.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-11 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Noorwegen voor 2: €1.993; €890 inclusief BTW geeft volgens mockregel €154 BTW.

**Techniek:** Prijscontrole.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:44:59 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen 1993 en Portugal 890 in fixture. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 21%inbegrepen:890−890/1.21≈154.

**Reproductiestappen:**

1. Kies QA Noorwegen 2 en controleer €1.993 in de wizard.
2. Sluit de wizard, kies QA Portugal en ga naar Reis.
3. Controleer dat €890 inclusief 21%BTW een afgeronde BTW-specificatie €154 geeft.

**Werkelijk resultaat:**

Noorwegen 1993: {"ok":true}

BTW op 890: "BTW, belastingen en verplichte kosten\n\nTarieven zonder bevestigd bedrag blijven configureerbaar.\n\nParticulier\nWaarvan BTW (21%) · inbegrepen\n € 154\nLuchthaven- en vertrekbelastingen\nVerwerkt in de getoonde vlucht- en reissom.\nInbegrepen in reissom\nLokale verplichte heffingen\nTarief moet bij de lokale leverancier worden bevestigd.\nConfigureerbaar tarief (p.p.)\nIndicatie ter plaatse te betalen\nTarief nog te bevestigen\nTotale reissom aan Voyage Vista\n € 890"

Inbegrepen BTW 154 bij reissom 890: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-11.png](<bewijs/O-11.png>), [O-11.json](<bewijs/O-11.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-12 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Lokale heffingen afzonderlijk zichtbaar en niet bij de reissom opgeteld.

**Techniek:** Prijscontrole.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:01 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Portugal 2; reissom 890. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** lokale heffing 10.1 pp=20.2; apart.

**Reproductiestappen:**

1. Kies QA Portugal 2 en vul lokale heffing 10.1 in.
2. Controleer afzonderlijke indicatie ter plaatse(€20 weergave) en ongewijzigde reissom €890.
3. Ga naar Controle; controleer Ter plaatse en opnieuw €890 reissom.

**Werkelijk resultaat:**

Belastingoverzicht: "BTW, belastingen en verplichte kosten\n\nTarieven zonder bevestigd bedrag blijven configureerbaar.\n\nParticulier\nWaarvan BTW (21%) · inbegrepen\n € 154\nLuchthaven- en vertrekbelastingen\nVerwerkt in de getoonde vlucht- en reissom.\nInbegrepen in reissom\nLokale verplichte heffingen\nTarief moet bij de lokale leverancier worden bevestigd.\nConfigureerbaar tarief (p.p.)\nIndicatie ter plaatse te betalen\n € 20\nTotale reissom aan Voyage Vista\n € 890"

Lokale indicatie afzonderlijk zichtbaar: {"ok":true}

Reissom blijft 890: {"ok":true}

Heffing apart in review: {"ok":true}

Reviewreissom ongewijzigd: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-12.png](<bewijs/O-12.png>), [O-12.json](<bewijs/O-12.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-13 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Bali prijswijziging €24 p.p. voor twee reizigers = €48 verschil.

**Techniek:** Functioneel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:03 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Bali; 2 personen. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Prijswijziging 24 pp=48 groep.

**Reproductiestappen:**

1. Kies QA Bali voor 2 reizigers en ga naar Reis.
2. Klik Nu controleren en inspecteer de beschikbaarheidsstatus en de aanwezigheid van Prijs bevestigen.
3. De status wordt direct geldig; de+€24 p.p.-mockgebeurtenis is niet bereikbaar. Registreer BLOCKED zonder deze gebeurtenis zelf te verzinnen.

**Werkelijk resultaat:**

Aangeboden prijswijzigingsactie: {"count":0, "availability":"Geladen reisgegevens gecontroleerd\nDe prijzen zijn actueel en alle onderdelen zijn beschikbaar.\nNu controleren"}

**Beperking/afwijking:** Bali activeert in de huidige app geen mockprijswijziging; controle gaat rechtstreeks naar geldig. Het voorgeschreven +€24 p.p.-scenario is niet bereikbaar. Er is geen alternatieve prijsupdatefixture geïnjecteerd.

**Status:** BLOCKED.

**Bewijs:** [O-13.png](<bewijs/O-13.png>), [O-13.json](<bewijs/O-13.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-14 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Transfer €54 + verzekering €29 p.p. voor twee: €890 + €54 + €58 = €1.002.

**Techniek:** Functioneel.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:05 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Portugalbasis 890 inclusief service. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Transfer 54 vast+verzekering 29 pp×2.

**Reproductiestappen:**

1. Kies QA Portugal 2; controleer startprijs €890.
2. Selecteer Transfer €54 vast en Verzekering €29 p.p.
3. Controleer €112 extras en €1.002 totaal in Reis én Controle.

**Werkelijk resultaat:**

Startprijs 890: {"ok":true}

Extra-prijsberekening: "Gekozen reisonderdelen\n € 812\nGekozen extra’s\n € 112\nServicekosten (2 × € 39)\n € 78\nTotale reissom\n € 1.002"

890+54+58=1002: {"ok":true}

Review 1002: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-14.png](<bewijs/O-14.png>), [O-14.json](<bewijs/O-14.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-15 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Niet-beschikbaar onderdeel of reis blokkeert voortgang; herstel of alternatief mogelijk.

**Techniek:** Negatieve test.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:07 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Beschikbaar reisrecord met onbeschikbaar vereist hotel en alternatief. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** QA Onderdeelconflict; origineel hotel→vervanging→herstel.

**Reproductiestappen:**

1. Kies QA Onderdeelconflict. De overdracht kiest aanvankelijk het beschikbare hotelalternatief.
2. Ga naar Reis en klik Wijzigen om het onbeschikbare originele hotel terug te kiezen. Controleer; voortgang moet blokkeren met fouttekst.
3. Klik opnieuw Wijzigen voor het beschikbare hotel en controleer opnieuw; voortgang moet herstellen.
4. Niet-beschikbare hele reizen zijn aanvullend gecontroleerd in R-04.

**Werkelijk resultaat:**

Onbeschikbaar onderdeel blokkeert voortgang: {"ok":true}

Fout bij onderdeel: {"ok":true}

Beschikbaar alternatief herstelt voortgang: {"ok":true}

Hele reis niet beschikbaar afzonderlijk bewezen in R-04

**Status:** PASS.

**Bewijs:** [O-15.png](<bewijs/O-15.png>), [O-15.json](<bewijs/O-15.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-16 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Persoonlijk bericht blijft behouden bij Vorige/Volgende, opslaan, herladen en heropenen.

**Techniek:** Persistentie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:09 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Persoonlijk bericht met Unicode en lange inhoud. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Vorige/Volgende; genereren; sluiten/heropenen; herladen.

**Reproductiestappen:**

1. Kies QA Portugal, ga naar Controle en vul het lange unieke persoonlijke bericht uit fixtures.mjs in.
2. Ga Vorige→Volgende; vergelijk de tekst exact.
3. Genereer concept. Controleer de snapshot, sluit en heropen de offertekaart; vergelijk de previewtekst exact.
4. Herladen en duurzaam teruglezen blijven geblokkeerd omdat de actieadapter niet opslaat.

**Werkelijk resultaat:**

Bericht behouden bij Vorige/Volgende: {"ok":true}

Bericht opgenomen in opgeslagen snapshot: {"ok":true}

Bericht behouden na heropenen binnen sessie: {"ok":true}

Concepten na reload zonder echte backend: 0

**Beperking/afwijking:** Vorige/Volgende, save-payload en heropenen bewezen. Reloadpersistentie van opgeslagen bericht niet verifieerbaar: backendacties zijn expliciete adapters zonder opslag.

**Status:** BLOCKED.

**Bewijs:** [O-16.png](<bewijs/O-16.png>), [O-16.json](<bewijs/O-16.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-17 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Persoonlijk bericht verschijnt in medewerkerpreview, klantpreview en demonstratiedownload.

**Techniek:** Integratie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:11 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Lang persoonlijk bericht in gegenereerd concept. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Medewerkerpreview; demonstratietxt; klantpreview met vastgelegde snapshot.

**Reproductiestappen:**

1. Kies QA Portugal, vul het lange unieke persoonlijke bericht in en genereer concept.
2. Vergelijk de medewerkerpreview met de exacte tekst; download het.txt-demonstratiebestand en vergelijk de inhoud.
3. Speel de vastgelegde snapshot expliciet in als verstuurde klantofferte. Open Mijn reis→Voorstel bekijken en vergelijk de tekst.
4. Deze klantpreviewcontrole bewijst geen backendoverdracht of e-mailverzending.

**Werkelijk resultaat:**

Bericht in medewerkerpreview: {"ok":true}

Bericht in demonstratiedownload: {"ok":true}

Bericht in klantpreview van opgenomen snapshot: {"ok":true}

Klantpreview gebruikt expliciet ingespeelde opgeslagen snapshot, geen echte verzending

**Status:** PASS.

**Bewijs:** [O-17-demonstratiedownload.txt](<bewijs/O-17-demonstratiedownload.txt>), [O-17.png](<bewijs/O-17.png>), [O-17.json](<bewijs/O-17.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-18 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Offerteconcept en gewijzigde gegevens blijven behouden na herladen.

**Techniek:** Persistentie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:17 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Frisse backendloze harness. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Conceptgenereren; aanpassen; herladen.

**Reproductiestappen:**

1. Kies QA Portugal, vul “QA concept bewaren” in en genereer concept.
2. Inspecteer de saveQuoteAction-snapshot op de gewijzigde tekst.
3. Herlaad en open Offertes. De adapter heeft geen opslag; concludeer geen productfout of opslagbewijs uit de lege fixture.
4. Verifieer duurzame opslag opnieuw in een verbonden Make/Payload-omgeving.

**Werkelijk resultaat:**

Conceptwijziging bereikt opslagactie: {"ok":true}

Herladen met niet-persistente actieadapter: {"cards":0}

**Beperking/afwijking:** Echte opslag en opnieuw ophalen van offerteconcepten vereist Figma/Payload-context; die ontbreekt lokaal (Environment ID could not be resolved). Geen vals persistentieresultaat uit de adapter afgeleid.

**Status:** BLOCKED.

**Bewijs:** [O-18.png](<bewijs/O-18.png>), [O-18.json](<bewijs/O-18.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-19 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Offertekaart, review en preview tonen dezelfde gegevens en bedragen.

**Techniek:** Integratie.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:19 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Noorwegen 2; klantZoë. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Review→preview→offertekaart→heropenen.

**Reproductiestappen:**

1. Kies QA Noorwegen 2 en ga naar Controle; controleer €1.993.
2. Genereer concept en vergelijk previewprijs en klant-e-mailadres.
3. Sluit, controleer klant, bestemming en bedrag op de offertekaart en heropen. De prijs moet opnieuw €1.993 zijn.

**Werkelijk resultaat:**

Review 1993: {"ok":true}

Preview 1993: {"ok":true}

Klant-e-mail in preview: {"ok":true}

Offertekaart: "Concept\nNoorwegen\n\nZoë van Dijk · OFF-2026-21197\n\n € 1.993\nZojuist"

Offertekaart consistent: {"ok":true}

Heropende preview 1993: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-19.png](<bewijs/O-19.png>), [O-19.json](<bewijs/O-19.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-20 — BLOCKED

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Reizen → offerte → concept → mockverzending/download → acceptatie → voorbeeldbetaling.

**Techniek:** End-to-end.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:21 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Reizen→offerte; mockactieadapters; geen betaalprovider. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Portugal 2; concept; download; delen; klantacceptatie; betaling.

**Reproductiestappen:**

1. Kies QA Portugal 2 vanuit Reizen, doorloop controle en genereer concept met uniek bericht.
2. Download demonstratiebestand en klik Delen met klant; inspecteer de aangeboden statusVerstuurd.
3. Speel de opgevangen offerte expliciet in als klantdata; de boeking is eveneens een herkenbare QA-fixture.
4. Open Mijn reis→Voorstel bekijken→Voorstel kiezen; inspecteer acceptQuoteAction.
5. Open Betalingsinformatie; de betaalactie is uitgeschakeld en meldt dat online betalen niet beschikbaar is. De volledige keten blijft BLOCKED.

**Werkelijk resultaat:**

Mockdeelactie geeft zichtbare status: {"ok":true}

StatusVerstuurd aangeboden aan adapter: {"ok":true}

Klantacceptatieactie aangeroepen: {"ok":true}

Betaalbeperking zichtbaar: {"ok":true}

Geen voorbeeldbetaling beschikbaar: {"ok":true}

**Beperking/afwijking:** Gedeeltelijke mockflow bewezen. Klantoverdracht en boeking expliciet ingespeeld, niet door echte backend aangemaakt. Volledige keten en voorbeeldbetaling geblokkeerd: geen Figma/Payload-context en betaalprovider/mockbetaalactie ontbreekt.

**Status:** BLOCKED.

**Bewijs:** [O-20-demonstratiedownload.txt](<bewijs/O-20-demonstratiedownload.txt>), [O-20-gedeeld.png](<bewijs/O-20-gedeeld.png>), [O-20.png](<bewijs/O-20.png>), [O-20.json](<bewijs/O-20.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Volledige hertest nodig na opheffen van de genoemde blokkade.

## O-21 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Dialog heeft naam/rol, beginfocus, focusval, Escape en focusterugkeer.

**Techniek:** Toegankelijkheid.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:24 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Toetsenbord en dialoog. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Naam/rol; beginfocus; Tab/Shift+Tab; Escape; focusterugkeer.

**Reproductiestappen:**

1. Open Offertes→Nieuwe offerte. Controleer dialogrol, naam, aria-modal en beginfocus.
2. Druk 35 keerTab en 15 keerShift+Tab; focus mag de dialoog niet verlaten.
3. DrukEscape; controleer sluiting en focus terug op Nieuwe offerte.

**Werkelijk resultaat:**

Dialog heeft correcte naam/rol: {"ok":true}

Modal semantiek: {"ok":true}

Beginfocus in dialoog: {"ok":true}

Focusval Tab 0: {"ok":true}

Focusval Tab 1: {"ok":true}

Focusval Tab 2: {"ok":true}

Focusval Tab 3: {"ok":true}

Focusval Tab 4: {"ok":true}

Focusval Tab 5: {"ok":true}

Focusval Tab 6: {"ok":true}

Focusval Tab 7: {"ok":true}

Focusval Tab 8: {"ok":true}

Focusval Tab 9: {"ok":true}

Focusval Tab 10: {"ok":true}

Focusval Tab 11: {"ok":true}

Focusval Tab 12: {"ok":true}

Focusval Tab 13: {"ok":true}

Focusval Tab 14: {"ok":true}

Focusval Tab 15: {"ok":true}

Focusval Tab 16: {"ok":true}

Focusval Tab 17: {"ok":true}

Focusval Tab 18: {"ok":true}

Focusval Tab 19: {"ok":true}

Focusval Tab 20: {"ok":true}

Focusval Tab 21: {"ok":true}

Focusval Tab 22: {"ok":true}

Focusval Tab 23: {"ok":true}

Focusval Tab 24: {"ok":true}

Focusval Tab 25: {"ok":true}

Focusval Tab 26: {"ok":true}

Focusval Tab 27: {"ok":true}

Focusval Tab 28: {"ok":true}

Focusval Tab 29: {"ok":true}

Focusval Tab 30: {"ok":true}

Focusval Tab 31: {"ok":true}

Focusval Tab 32: {"ok":true}

Focusval Tab 33: {"ok":true}

Focusval Tab 34: {"ok":true}

Focusval Shift+Tab 0: {"ok":true}

Focusval Shift+Tab 1: {"ok":true}

Focusval Shift+Tab 2: {"ok":true}

Focusval Shift+Tab 3: {"ok":true}

Focusval Shift+Tab 4: {"ok":true}

Focusval Shift+Tab 5: {"ok":true}

Focusval Shift+Tab 6: {"ok":true}

Focusval Shift+Tab 7: {"ok":true}

Focusval Shift+Tab 8: {"ok":true}

Focusval Shift+Tab 9: {"ok":true}

Focusval Shift+Tab 10: {"ok":true}

Focusval Shift+Tab 11: {"ok":true}

Focusval Shift+Tab 12: {"ok":true}

Focusval Shift+Tab 13: {"ok":true}

Focusval Shift+Tab 14: {"ok":true}

Escape sluit dialoog: {"ok":true}

Focus terug naar opener: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-21.png](<bewijs/O-21.png>), [O-21.json](<bewijs/O-21.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-22 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Hele wizard werkt met Tab, Shift+Tab, Enter en spatie; focus zichtbaar.

**Techniek:** Toegankelijkheid.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:26 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Volledige wizard met keyboard. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Tab; Shift+Tab; Enter; spatie; focusindicator.

**Reproductiestappen:**

1. Open Offertes en bereik Nieuwe offerte met natuurlijke Tabstappen; activeer metEnter.
2. Bereik de klant metTab en selecteer metspatie. Bereik aantal, selecteer tekst metCtrl+A en typ 2.
3. Bereik Volgende metTab en activeer metEnter. Controleer de gekozen reis viaTab/Enter.
4. Controleer de zichtbare focusstijl, ga naar Controle, vul bericht via toetsenbord in en testShift+Tab.
5. Bereik genereren metTab en activeer metspatie; controleer het bericht in de preview.

**Werkelijk resultaat:**

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"Nieuwe offerte", "id":""}, "tabs":6}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"ZvZoë van Dijkzoe+qa@example.nl · 0612345678 · Particulier · Bestaand dossier · ", "id":""}, "tabs":2}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"INPUT", "text":"", "id":""}, "tabs":5}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"Volgende stap ", "id":""}, "tabs":2}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"Nu controleren", "id":""}, "tabs":5}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"Volgende stap ", "id":""}, "tabs":2}

Focusstijl: {"outline":"solid", "width":"2 px", "shadow":"none"}

Zichtbare keyboardfocus: {"ok":true}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"TEXTAREA", "text":"Hoi Zoë, hierbij vind je ons voorstel voor QA Portugal. Laat gerust weten als je", "id":""}, "tabs":3}

Shift+Tab blijft in wizard: {"ok":true}

Bereikt met natuurlijke Tabvolgorde: {"element":{"tag":"BUTTON", "text":"Offerte genereren ", "id":""}, "tabs":3}

Volledige wizard tot preview via Tab/Shift+Tab/Enter/spatie bediend: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-22.png](<bewijs/O-22.png>), [O-22.json](<bewijs/O-22.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-23 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Documenttaal Nederlands; foutmeldingen hebben tekst en zijn niet alleen kleurafhankelijk.

**Techniek:** Toegankelijkheid.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:29 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** App-layoutbron en browsermeldingen. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** langnl; ongeldig aantal; tekstfout en aria-describedby.

**Reproductiestappen:**

1. Controleer de Nederlandse fallback in de echte rootlayout en lang=nl op de echte lokale loginpagina.
2. Kies QA Portugal en vul 0 reizigers in.
3. Controleer fouttekst, zichtbaarheid, aria-describedby en aria-invalid; de fout mag niet uitsluitend kleur gebruiken.

**Werkelijk resultaat:**

Fout gekoppeld aan invoer: {"ok":true}

Tekstuele fout zichtbaar: {"ok":true}

Fouttekst: "Vul een geheel aantal reizigers in van 1 tot en met 20."

Echte rootlayout heeft Nederlandse fallback: {"ok":true}

Harnessdocument Nederlands: {"ok":true}

Geen productie-DOMaudit: taal in echte layoutbron plus geïsoleerde DOM gecontroleerd

**Status:** PASS.

**Bewijs:** [O-23.png](<bewijs/O-23.png>), [O-23.json](<bewijs/O-23.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-24 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Alle offertestadia op 390 × 844; acties bereikbaar, geen onbedoelde horizontale overloop.

**Techniek:** Responsiviteit.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:30 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Alle wizardstadia; lange Unicode-inhoud. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** 390×844.

**Reproductiestappen:**

1. Kies QA Portugal en zet viewport 390×844.
2. Meet document- en dialoogbreedte in Klant, Reis, Controle en Preview.
3. Breng telkens de onderste actie in beeld; in Controle en Preview wordt het lange persoonlijke bericht gebruikt.
4. Leg screenshots en alle breedtemetingen vast; geen onbedoelde horizontale overloop.

**Werkelijk resultaat:**

klant: {"pageWidth":390, "viewport":390, "dialogWidth":324, "clientWidth":324}

Geen horizontale overloop klant: {"ok":true}

reis: {"pageWidth":390, "viewport":390, "dialogWidth":324, "clientWidth":324}

Geen horizontale overloop reis: {"ok":true}

controle: {"pageWidth":390, "viewport":390, "dialogWidth":324, "clientWidth":324}

Geen horizontale overloop controle: {"ok":true}

preview: {"pageWidth":390, "viewport":390, "dialogWidth":324, "clientWidth":324}

Geen horizontale overloop preview: {"ok":true}

**Status:** PASS.

**Bewijs:** [O-24-klant.png](<bewijs/O-24-klant.png>), [O-24-reis.png](<bewijs/O-24-reis.png>), [O-24-controle.png](<bewijs/O-24-controle.png>), [O-24-preview.png](<bewijs/O-24-preview.png>), [O-24.png](<bewijs/O-24.png>), [O-24.json](<bewijs/O-24.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-25 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Opslag onbeschikbaar: duidelijke melding, geen vals succes, veilig herstel.

**Techniek:** Foutafhandeling.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:45:33 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Gecontroleerde foutinjectie in serveractieadapter. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Opslag faalt; geen vals succes; herstelde opslag.

**Reproductiestappen:**

1. Kies QA Portugal, ga naar Controle en vul “QA herstelbericht” in.
2. Laat getItem/setItem van browseropslag een SecurityError werpen en bevestig dat opslag onbeschikbaar is.
3. Laat de save-actieadapter eerst een gestructureerde opslagfout retourneren; controleer fouttekst, geen preview en behoud van invoer.
4. Laat de adapter daarna een transportfout werpen; controleer dat ook die opgevangen wordt.
5. Herstel de adapter en genereer opnieuw; verwacht exact 3 pogingen en een correcte preview. Dit is foutinjectie, geen echte backendstoring.

**Werkelijk resultaat:**

Browseropslag gecontroleerd onbeschikbaar: {"ok":true}

Duidelijke opslagfout: {"ok":true}

Geen vals opgeslagen preview: {"ok":true}

Invoer behouden na fout: {"ok":true}

Transportfout opgevangen zonder vals succes: {"ok":true}

Invoer behouden na transportfout: {"ok":true}

Veilig opnieuw proberen slaagt via adapter: {"ok":true}

Browseropslag geblokkeerd; gestructureerde opslagfout en geworpen transportfout gesimuleerd; daarna veilig herstel

**Status:** PASS.

**Bewijs:** [O-25-opslagfout.png](<bewijs/O-25-opslagfout.png>), [O-25.png](<bewijs/O-25.png>), [O-25.json](<bewijs/O-25.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

## O-26 — PASS

**Pagina/functionaliteit:** Offerte maken.

**Doel en verwacht resultaat:** Bewust veroorzaakte renderfout toont herstelbaar eigen foutscherm; normale flow zonder onverwachte JS-fouten.

**Techniek:** Foutafhandeling.

**Testdatum en uitvoerder:** zondag 1 november 2026 om 15:46:41 CET; Codex.

**Browser/viewport/build:** Microsoft Edge 156.0.4314.58, Chromium headless; 1440×1000, voor R-15/O-24 ook 390×844; Windows; bronversie vastgelegd met SHA-256 in [omgeving.json](<bewijs/omgeving.json>). Geen Git-commit beschikbaar.

**Precondities:** Echte ErrorBoundary om app; bewuste foutinjectie. Elke testcase krijgt een nieuwe browsercontext met lege cookies en browseropslag. Data staat in [fixtures.mjs](<harness/fixtures.mjs>); geen reset of mutatie van echte Payload-data.

**Testdata:** Normale wizard; Faultcomponent; reloadherstel.

**Reproductiestappen:**

1. Doorloop de normale offertewizard en controleer op onverwachte JavaScriptfouten.
2. Roep de harnessfunctie __renderFault() aan; de echte ErrorBoundary moet het eigen foutscherm tonen.
3. Controleer de herstelknop en maak een screenshot.
4. Klik Pagina opnieuw laden; controleer dat de normale werkruimte terugkomt. De opzettelijke fout is apart gelogd.

**Werkelijk resultaat:**

Normale flow zonder onverwachte JS- of consolefouten: {"ok":true, "pageErrors":[], "consoleErrors":[]}

Eigen foutscherm getoond: {"ok":true}

Herstelactie bereikbaar: {"ok":true}

Herladen herstelt normale app: {"ok":true}

Bewuste renderfout is verwacht: {"errors":[]}

**Status:** PASS.

**Bewijs:** [O-26-foutscherm.png](<bewijs/O-26-foutscherm.png>), [O-26.png](<bewijs/O-26.png>), [O-26.json](<bewijs/O-26.json>). Het JSON-bestand bevat tijdstippen, observaties en zichtbare paginainhoud.

**Bug-ID:** Geen bevestigde productbug geregistreerd; eventuele BLOCKED-reden staat hierboven.

**Hertest/opmerkingen:** Opnieuw uitvoerbaar met de meegeleverde harness. Geen oude PASS overgenomen.

