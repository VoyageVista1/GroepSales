# Volledige mockklantreis — O-20

**Status: BLOCKED.** Dit is een apart verslag van testcase O-20; geen extra testcase in de telling van 41.

De volgende delen zijn in deze nieuwe ronde zichtbaar uitgevoerd met de echte React-schermen:

1. Vanuit Reizen QA Portugal geselecteerd voor Zoë,2 reizigers.
2. Offertewizard doorlopen, geladen beschikbaarheid gecontroleerd en concept aangeboden aan de save-actieadapter.
3. Demonstratiebestand werkelijk gedownload: [O-20-demonstratiedownload.txt](<bewijs/O-20-demonstratiedownload.txt>).
4. Delen met klant uitgevoerd; de adapter ontvangt statusVerstuurd en de UI toont een deelbevestiging. Dit is geen bewijs van e-mail of backenddeling.
5. De opgevangen offerte expliciet ingespeeld als klantfixture. Voorstel bekijken en Voorstel kiezen roepen de acceptatieactie aan.
6. Een aparte herkenbare QA-boekingsfixture gebruikt om Betalingsinformatie te openen. Het scherm meldt dat online betalen niet beschikbaar is; de betaalproviderknop is uitgeschakeld.

Er is geen doorgaande backendketen aangetoond. De klantoverdracht en boeking bij stap 5/6 zijn door de harness ingespeeld. De huidige app biedt geen voorbeeldbetaalactie. **Acceptatie→automatisch aangemaakte boeking→voorbeeldbetaling blijft niet uitgevoerd als volledige keten.**

Omgeving: Edge 156.0.4314.58,1440×1000, Windows, locale nl-NL, 1 november 2026. Precondities, testdata, alle reproductiestappen en waarnemingen staan in [O-20-log](<bewijs/O-20.json>) en [het offertetestrapport](<Testrapport_Offerte_maken.md>). Aanvullend bewijs: [gedeeld concept](<bewijs/O-20-gedeeld.png>), [betaalbeperking](<bewijs/O-20.png>).

Hertest na herstel van de verbonden Make/Payload-context: gebruik echte wegwerp-QA-records via de aangewezen Payload-datatooling en loop de volledige keten zonder ingespeelde overdracht door. Leg pas dan daadwerkelijke opslag, klantdeling en boekingscreatie vast. Herhaal de voorbeeldbetaling alleen als die mockflow in de applicatie beschikbaar is. Echte betaling of e-mail valt buiten dit testplan.
