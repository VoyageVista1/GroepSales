# VoyageVista — testmethodiek nieuwe testronde

**Scope:** pagina's Reizen en Offerte maken, inclusief de relevante overdracht tussen beide schermen.  
**Doel:** een nieuwe, onafhankelijke testuitvoering.  
**Let op:** dit is een testplan; de genoemde testgevallen zijn nog niet opnieuw uitgevoerd. Neem eerdere PASS-resultaten niet automatisch over.

## 1. Algemene testaanpak

- **Functionele scenariotests:** voer een taak uit zoals een gebruiker dat zou doen, van begin tot zichtbaar resultaat.
- **Equivalentieklassen:** kies representatieve geldige en ongeldige invoerwaarden.
- **Grenswaardeanalyse:** test waarden net onder, op en net boven een limiet.
- **Beslissingstabellen:** combineer voorwaarden, bijvoorbeeld beschikbaarheid, groepsgrootte, budget en datum.
- **Toestandsovergangen:** test concept, wijzigen, opslaan, heropenen, controleren en genereren.
- **Negatieve tests:** controleer foutieve invoer, conflicten en herstel na fouten.
- **Integratie- en end-to-endtests:** controleer gegevensoverdracht tussen Reizen, Offerte maken en relevante mockflows.
- **Regressietests:** voer eerder gefaalde én eerder geslaagde kritieke scenario's opnieuw uit.
- **Toegankelijkheidstests:** toetsenbord, focus, dialooggedrag, veldlabels en foutmeldingen.
- **Responsiviteitstests:** desktop 1440 × 1000 en mobiel 390 × 844, inclusief lange inhoud.
- **Persistentie- en foutafhandelingstests:** herladen, conceptopslag, onbeschikbare opslag en herstel.

### Uitvoeringsregels

1. Leg per testcase test-ID, doel, techniek, precondities, testdata, stappen, verwacht resultaat, werkelijk resultaat, bewijs en status vast.
2. Gebruik uitsluitend **PASS**, **FAIL**, **BLOCKED** of **NOT RUN**. PASS vereist aantoonbaar resultaat.
3. Start met een bekende mockdata- en opslagtoestand; documenteer eventuele resets.
4. Test ook herstel: corrigeer ongeldige invoer en controleer dat de gebruiker verder kan.
5. Maak screenshots of logs bij afwijkingen en vermeld de exacte reproductiestappen.
6. Claim geen echte betaling, verzending of backendintegratie: dit betreft een interactieve mockapplicatie.
7. Noteer browser, viewport, build/commit en testdatum.

## 2. Testmatrix — Reizen

| ID | Methode | Uit te voeren controle / verwacht resultaat |
|---|---|---|
| R-01 | Functioneel, equivalentieklassen | Zoek op bestemming en combineer prijs- en beoordelingsfilters; alleen passende reizen verschijnen. |
| R-02 | Grenswaardeanalyse | Beoordeling precies op de minimumgrens wordt correct meegenomen. |
| R-03 | Grenswaardeanalyse | Controleer resterende plaatsen: 4 reizigers bij 4 plaatsen toegestaan; 5 bij 4 plaatsen geweigerd. |
| R-04 | Beslissingstabel | Gearchiveerde, niet-beschikbare en te kleine reizen kunnen niet worden geselecteerd. |
| R-05 | Negatieve test | Retourdatum vóór vertrekdatum toont een specifieke fout, niet uitsluitend 'geen resultaten'. |
| R-06 | Grenswaardeanalyse | Exacte vertrek- en retourdatums werken, inclusief datumgrenzen. |
| R-07 | Functioneel | Controleer alle sorteeropties op de daadwerkelijke volgorde. |
| R-08 | Grenswaardeanalyse | Maximaal drie reizen vergelijken; vierde selectie wordt geweigerd. |
| R-09 | Integratie | Geselecteerde reis, datums, reizigers en klantcontext gaan correct mee naar Offerte maken. |
| R-10 | Beslissingstabel | Reis met maximum 8: groep van 8 toegestaan, 9 geweigerd; na correctie opnieuw controleren. |
| R-11 | Persistentie, functioneel | Favoriet bewaren; na wijziging groepsgrootte volgt prijs actuele groep en aanvraag respecteert capaciteit. |
| R-12 | Beslissingstabel | Alternatieven voldoen aan actieve filters, capaciteit, datum en budget; anders duidelijke melding. |
| R-13 | Integratie | Overdracht vanuit Klantvragen bewaart klant, bestemming, aantal, datums en budget. |
| R-14 | Prijscontrole | Catalogus, details en offerte tonen consistente groepsprijs; controleer Noorwegen voor 2 (€1.993) met juiste mockdata. |
| R-15 | Responsiviteit | Filters, detailacties en vergelijkingsknoppen blijven bereikbaar op desktop en mobiel. |

## 3. Testmatrix — Offerte maken

| ID | Methode | Uit te voeren controle / verwacht resultaat |
|---|---|---|
| O-01 | Equivalentieklassen | Ongeldige e-mailadressen geweigerd; geldig adres met plus-adressering toegestaan. |
| O-02 | Negatieve test | Naam en telefoon na trimmen niet leeg; Unicode-naam toegestaan. |
| O-03 | Grenswaardeanalyse | Reizigers: leeg, 0, 1, 2, 19, 20, 21, 1,5. Alleen gehele waarden 1–20 zijn invoertechnisch geldig. |
| O-04 | Beslissingstabel | Ook geldig reizigersaantal moet passen binnen capaciteit van gekozen reis. |
| O-05 | Toestandsovergang | Wijzig groepsgrootte tijdens lopende beschikbaarheidscontrole; verouderde uitkomst mag niet worden gebruikt. |
| O-06 | Grenswaardeanalyse | BTW: -0,1; 0; 0,05; 0,1; 29,9; 30; 30,1. Alleen 0–30 met stap 0,1 geldig. |
| O-07 | Equivalentieklassen | Lokale heffing: leeg toegestaan, negatieve waarden geweigerd, niet-negatief met stap 0,1; geen nieuw maximum aannemen. |
| O-08 | Negatieve test | Ongeldige belasting blokkeert doorgaan, controleren, bevestigen en genereren met begrijpelijke melding. |
| O-09 | Prijscontrole | Basisprijs, vaste kosten, kosten per persoon, extra's, prijsaanpassingen en €39 servicekosten p.p. correct verwerkt. |
| O-10 | Prijscontrole | Exacte groepsprijs wordt berekend vóór afronding van getoonde p.p.-prijs. |
| O-11 | Prijscontrole | Noorwegen voor 2: €1.993; €890 inclusief BTW geeft volgens mockregel €154 BTW. |
| O-12 | Prijscontrole | Lokale heffingen afzonderlijk zichtbaar en niet bij de reissom opgeteld. |
| O-13 | Functioneel | Bali prijswijziging €24 p.p. voor twee reizigers = €48 verschil. |
| O-14 | Functioneel | Transfer €54 + verzekering €29 p.p. voor twee: €890 + €54 + €58 = €1.002. |
| O-15 | Negatieve test | Niet-beschikbaar onderdeel of reis blokkeert voortgang; herstel of alternatief mogelijk. |
| O-16 | Persistentie | Persoonlijk bericht blijft behouden bij Vorige/Volgende, opslaan, herladen en heropenen. |
| O-17 | Integratie | Persoonlijk bericht verschijnt in medewerkerpreview, klantpreview en demonstratiedownload. |
| O-18 | Persistentie | Offerteconcept en gewijzigde gegevens blijven behouden na herladen. |
| O-19 | Integratie | Offertekaart, review en preview tonen dezelfde gegevens en bedragen. |
| O-20 | End-to-end | Reizen → offerte → concept → mockverzending/download → acceptatie → voorbeeldbetaling. |
| O-21 | Toegankelijkheid | Dialog heeft naam/rol, beginfocus, focusval, Escape en focusterugkeer. |
| O-22 | Toegankelijkheid | Hele wizard werkt met Tab, Shift+Tab, Enter en spatie; focus zichtbaar. |
| O-23 | Toegankelijkheid | Documenttaal Nederlands; foutmeldingen hebben tekst en zijn niet alleen kleurafhankelijk. |
| O-24 | Responsiviteit | Alle offertestadia op 390 × 844; acties bereikbaar, geen onbedoelde horizontale overloop. |
| O-25 | Foutafhandeling | Opslag onbeschikbaar: duidelijke melding, geen vals succes, veilig herstel. |
| O-26 | Foutafhandeling | Bewust veroorzaakte renderfout toont herstelbaar eigen foutscherm; normale flow zonder onverwachte JS-fouten. |

## 4. Uitvoervolgorde

1. **Smoke:** applicatie start, Reizen laadt, offertewizard opent.
2. **Positieve scenario's:** zoeken, filteren, vergelijken, selecteren, offerte maken.
3. **Negatieve en grenstests:** capaciteit, datums, reizigersaantal, e-mail, BTW en heffingen.
4. **Combinaties:** budget + beschikbaarheid + datum + prijs.
5. **Toestanden:** concept, wijzigen, opslaan, heropenen en opnieuw controleren.
6. **End-to-end:** volledige mockklantreis.
7. **Toegankelijkheid en mobiel:** toetsenbord, focus, meldingen en layout.
8. **Regressie:** herhaal kritieke eerder geslaagde en eerder mislukte gevallen.

## 5. Registratiesjabloon per testcase

```text
Test-ID:
Pagina / functionaliteit:
Testdatum en uitvoerder:
Browser / viewport / build:
Testtechniek:
Doel:
Precondities:
Testdata:
Stappen:
  1.
  2.
  3.
Verwacht resultaat:
Werkelijk resultaat:
Status: PASS / FAIL / BLOCKED / NOT RUN
Bewijs (screenshot, video, console, log):
Bug-ID (bij FAIL):
Hertest / opmerkingen:
```

## 6. Verplichte eindrapportage

Maak **twee afzonderlijke testrapporten**, één voor Reizen en één voor Offerte maken. Vermeld per rapport aantallen gepland/uitgevoerd/PASS/FAIL/BLOCKED/NOT RUN, bevindingen met reproduceerstappen en bewijs, dekking per techniek, omgeving en beperkingen. Rapporteer de volledige end-to-end-flow afzonderlijk omdat die beide pagina's raakt. Vermeld expliciet welke controles niet zijn uitgevoerd (bijvoorbeeld andere browserengines, screenreader-audit, echte backend, echte e-mail en echte betaling).

**Afrondcriterium:** kritieke scenario's uitgevoerd, geen open blokkerende afwijkingen, alle andere afwijkingen vastgelegd en hertestbaar. Gebruik eerdere resultaten uitsluitend als vergelijkingsmateriaal, nooit als bewijs voor de nieuwe testronde.
