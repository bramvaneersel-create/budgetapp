# Jaarbudget installeren op je iPhone

De app bestaat uit een paar bestanden die één keer online moeten staan, zodat Safari ze kan installeren. Daarna draait alles offline op je telefoon. Je financiële gegevens komen nooit op internet: ze staan alleen in de app op je iPhone.

## 1. Bestanden online zetten (GitHub Pages, gratis)

1. Maak een account op github.com (zet tweestapsverificatie aan).
2. Klik **New repository**, naam bijv. `jaarbudget`, kies **Public**, maak hem aan.
3. Klik **uploading an existing file** en sleep alle bestanden uit deze map erin (niet de map zelf). Klik **Commit changes**.
4. Ga naar **Settings → Pages**. Bij *Branch* kies `main` en `/ (root)`, klik **Save**.
5. Na een minuut staat de app op `https://<jouw-naam>.github.io/jaarbudget/`.

Er staat op GitHub alleen de lege app, zonder gegevens.

## 2. Installeren op je iPhone

1. Open die link in **Safari**.
2. Tik op het deelicoon → **Zet op beginscherm** → **Voeg toe**.
3. Open de app voortaan via het icoon. Gebruik hem niet in Safari zelf: het icoon heeft zijn eigen, aparte opslag.
4. Test: zet vliegtuigmodus aan en open de app. Hij werkt gewoon.

## 3. Starten

1. Zet `budget-2027.csv` in iCloud Drive (**niet** op GitHub: daar staat alleen de lege app).
2. **Budget inlezen** en kies boekjaar 2027.
3. Controleer in Instellingen het startsaldo (na de storting van januari) en de rente.
4. Maak in Dyme een export en kies **Dyme-export inlezen**. De eerste keer koppel je de Dyme-categorieën aan je budgetposten.

## Veiligheid

- Een ingebouwde beveiligingsregel (Content Security Policy) verbiedt de app elke internetverbinding.
- Maak af en toe een back-up via **Instellingen → Back-up maken** (bijv. naar iCloud Drive). Verwijder je het icoon, dan zijn je gegevens weg.
- Wil je zeker weten dat de app nooit meer verandert? Zet na installatie GitHub Pages weer uit. De geïnstalleerde app blijft werken; voor een update zet je Pages tijdelijk weer aan.
