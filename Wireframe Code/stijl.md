# VoyageVista — UI-stijlgids

**Versie:** 1.0  
**Status:** Voorstel voor alle teams  
**Toepassing:** Klantensite en medewerkerssite

## Uitgangspunten

Gebruik in de hele applicatie dezelfde kleuren, knoppen en interactiepatronen. De klantensite mag meer foto's en grotere koppen bevatten; de medewerkerssite richt zich op snel en duidelijk werken.

## 1. Kleuren

De kleuren sluiten aan op de huidige VoyageVista-website. Voor knoppen wordt waar nodig een donkerdere tint gebruikt om witte tekst leesbaar te houden.

| Kleur | Hexcode | Gebruik |
|---|---|---|
| Donkerblauw | `#071525` | Menu, bovenbalk en donkere delen |
| Diepgroen | `#153B3B` | Belangrijke knoppen en koppen bij medewerkers |
| Koraal | `#C96F5D` | Accentkleur klantensite |
| Donker koraal | `#A94D3D` | Knoppen met witte tekst op de klantensite |
| Mint | `#8FE0C0` | Kleine accenten op donkere achtergronden |
| Crème | `#F7F3EC` | Pagina-achtergronden |
| Wit | `#FFFFFF` | Kaarten, tabellen en formulieren |
| Zachtgroen | `#C7D8D0` | Randen en scheidingslijnen |
| Grijsgroen | `#526A68` | Uitleg en minder belangrijke tekst |

## 2. Statussen en meldingen

Communiceer een status **nooit uitsluitend met kleur**: voeg altijd duidelijke tekst toe.

| Status | Voorbeeld | Tekstkleur | Achtergrond |
|---|---|---|---|
| Gelukt | Opgeslagen | `#166534` | `#DCFCE7` |
| Waarschuwing | Contract verloopt binnenkort | `#92400E` | `#FEF3C7` |
| Fout | Opslaan mislukt | `#991B1B` | `#FEE2E2` |
| Informatie | 3 nieuwe aanbiedingen | `#1D4ED8` | `#DBEAFE` |

## 3. Typografie, afstanden en vormen

- **Lettertype:** League Spartan; fallback: Arial.
- **Paginatitel:** 32 px.
- **Tussenkop:** 24 px.
- **Kaarttitel:** 20 px.
- **Normale tekst:** 16 px.
- **Veldlabels en tabeltekst:** 14–16 px.
- **Spacing-schaal:** 4, 8, 12, 16, 24 en 32 px.
- **Minimale hoogte van knoppen en invoervelden:** 44 px.
- **Afronding van knoppen:** 8 px.
- **Afronding van kaarten:** 12 px.
- **Iconen:** Lucide. Voeg tekst toe wanneer de betekenis van een icoon niet vanzelfsprekend is.

## 4. Herbruikbare UI-componenten

| Component | Afspraak |
|---|---|
| Primaire knop | Belangrijkste actie op de pagina, zoals **Nieuw reisproduct** of **Opslaan**. Diepgroen met witte tekst. |
| Secundaire knop | Minder belangrijke actie. Wit of licht met groene rand en groene tekst. |
| Invulveld | Duidelijk label boven het veld; verplichte velden aangeven; eventuele uitleg eronder. |
| Dropdown | Dezelfde hoogte en rand als een invoerveld; toon de geselecteerde waarde. |
| Zoeken en filters | Zoekbalk boven het overzicht; actieve filters zichtbaar; optie **Filters wissen**. |
| Tabellen en lijsten | Duidelijke kolomnamen, zoekfunctie en acties zoals **Bekijken** of **Bewerken**. |
| Statuslabel | Tekst zoals **Concept**, **Actief**, **Verloopt binnenkort** of **Gearchiveerd**. |
| Succesmelding | Korte bevestiging na een actie, bijvoorbeeld **Leverancier opgeslagen**. |
| Foutmelding | Beschrijf wat fout ging en wat de gebruiker moet aanpassen. |
| Bevestiging | Voor belangrijke acties zoals verwijderen; gebruik **Annuleren** en **Verwijderen**. |
| Pop-upvenster | Alleen voor korte acties; grote formulieren krijgen een eigen pagina. |

## 5. Pagina-indeling

### Klantensite

- Het menu staat bovenaan.
- Klanten kunnen daaronder reizen zoeken en bekijken.
- Foto's en grotere koppen zijn passend.
- Actieknoppen zoals **Bekijk reis** en **Boek reis** zijn duidelijk herkenbaar.

### Medewerkerssite

- Links staat een vast of inklapbaar applicatiemenu.
- Bovenaan staat bijvoorbeeld de ingelogde gebruiker.
- Iedere pagina heeft een titel en de belangrijkste actie rechtsboven.
- **Overzichtspagina:** titel, zoeken, filters en tabel of lijst.
- **Detailpagina:** gegevens van één product, leverancier, contract of klant, met duidelijke acties.
- **Formulier:** logisch gegroepeerde velden, met **Annuleren** en **Opslaan** onderaan.
- **Kleinere schermen:** pas de indeling aan; tabellen mogen indien nodig horizontaal scrollen.

## 6. Consistent gedrag van acties

| Actie | Verwacht gedrag |
|---|---|
| **Opslaan** | Slaat wijzigingen op en toont daarna een korte melding. |
| **Annuleren** | Stopt de actie; waarschuwt eerst bij niet-opgeslagen werk. |
| **Bewerken** | Opent het scherm om gegevens aan te passen. |
| **Verwijderen** | Verwijdert definitief, uitsluitend na duidelijke bevestiging. |
| **Archiveren** | Verwijdert uit de actieve lijst maar bewaart de gegevens. |
| **Terug** | Keert terug naar het vorige overzicht; behoud filters bij voorkeur. |
| **Bevestigen** | Maakt een keuze definitief; gebruik waar mogelijk een specifiek label zoals **Contract bevestigen**. |

## 7. Toegankelijkheid

- Zorg dat tekst goed leesbaar is tegen de achtergrond.
- Normale tekst heeft een contrastverhouding van minimaal **4,5:1**.
- Grote tekst heeft een contrastverhouding van minimaal **3:1**.
- Knoppen en velden zijn via **Tab** bereikbaar.
- Het element met toetsenbordfocus heeft een zichtbare rand.
- Ieder veld heeft een begrijpelijk, zichtbaar label; placeholdertekst alleen is onvoldoende.
- Statussen en fouten worden niet alleen via rood of groen gecommuniceerd.
- Foutmeldingen leggen kort uit wat er fout ging.

## 8. Checklist: wireframe gereed

- [ ] Kleuren, lettergroottes en knoppen volgen deze stijlgids.
- [ ] Het scherm gebruikt dezelfde navigatie als de rest van de medewerkerssite, indien van toepassing.
- [ ] Overzicht, detail en belangrijkste actie zijn uitgewerkt waar nodig.
- [ ] Geen resultaten, foutieve invoer en een geslaagde actie zijn meegenomen.
- [ ] Knopnamen zijn consistent tussen schermen.
- [ ] Het scherm sluit aan op de use case en user flow.

## Bronbestanden

De oorspronkelijke UI-afspraken verwijzen naar de GitHub-branch `test-wireframe`:

- `frontend/src/components/voyage-vista.css` — kleuren en bestaande styling.
- `voyage-vista-font.css` — lettertype.
- `frontend/src/components/ui/` — bestaande knoppen en invoervelden.

---

*Omgezet vanuit `VoyageVista_UI_Stijl.docx`, versie 1.0. De inhoudelijke afspraken zijn behouden.*
