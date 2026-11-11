'use strict';
/* Woordenlijst Nederlands → Engels. {} staat voor een variabel deel (bedrag, datum, naam, aantal).
   Alleen teksten van de app zelf; namen die je zelf invoert (budgetten, categorieën) worden niet vertaald. */
window.I18N_EN = [
  // tabbladen en koppen
  ['Overzicht', 'Overview'], ['Budgetten', 'Budgets'], ['Spaarrekening', 'Savings'], ['Instellingen', 'Settings'],
  ['Boekjaar', 'Budget year'], ['Boekjaar {}', 'Budget year {}'], ['Boekjaar {} begint', 'Budget year {} starts'],
  ['Boekjaar {} is afgelopen', 'Budget year {} has ended'], ['Boekjaar {} starten?', 'Start budget year {}?'],
  ['Taal', 'Language'], ['Taal kiezen', 'Choose language'], ['Budget', 'Budget'], ['Back-up', 'Backup'], ['Privacy', 'Privacy'], ['Gegevens', 'Data'], ['Dyme', 'Dyme'],

  // welkom / demo
  ['Welkom.', 'Welcome.'], ['Lees je jaarbudget in, of bekijk de app eerst met demogegevens.', 'Import your yearly budget, or explore the app with demo data first.'],
  ['Budget inlezen', 'Import budget'], ['Sjabloon downloaden', 'Download template'], ['Demo bekijken', 'View demo'],
  ['Je bekijkt demogegevens.', 'You are viewing demo data.'], ['Wissen', 'Clear'],

  // acties
  ['Geld opnemen', 'Withdraw money'], ['van spaarrekening', 'from savings'], ['Losse uitgave', 'One-off expense'],
  ['jaarbudget of spaarpost', 'yearly budget or savings item'], ['Dyme-export inlezen', 'Import Dyme export'],
  ['Laatst: {} · {} transacties', 'Last: {} · {} transactions'], ['Nog niets ingelezen', 'Nothing imported yet'],

  // maand afsluiten
  ['Morgen salaris — maand afsluiten', 'Payday tomorrow — close the month'], ['Salaris ontvangen — maand afsluiten', 'Salary received — close the month'],
  ['Lees je Dyme-export in en controleer het saldo van je spaarrekening.', 'Import your Dyme export and check your savings balance.'],
  ['✓ Dyme ingelezen', '✓ Dyme imported'], ['Saldo invoeren', 'Enter balance'], ['✓ Saldo ingevoerd', '✓ Balance entered'],

  // nieuwe periode
  ['Nieuwe periode', 'New period'], ['Volgend salaris', 'Next salary'], ['Eerste salaris', 'First salary'], ['dag', 'day'], ['dagen', 'days'],

  // deze periode (dashboard)
  ['Deze periode · maandbudgetten', 'This period · monthly budgets'], ['van {} · grens {}', 'of {} · limit {}'],
  ['boven doel · nog {} tot je grens', 'over goal · {} left until your limit'], ['boven je grens', 'over your limit'],
  ['Nog geen Dyme-gegevens voor deze periode', 'No Dyme data for this period yet'],
  ['Start een nieuw boekjaar via Instellingen', 'Start a new budget year in Settings'],

  // prognose
  ['Prognose spaarrekening eind budgetjaar', 'Savings forecast end of budget year'], ['Hoe?', 'How?'],
  ['Waarschijnlijk tussen {} en {}', 'Likely between {} and {}'], ['Op basis van je budget', 'Based on your budget'],
  ['Nu op spaarrekening', 'Currently in savings'], ['Volgens plan', 'According to plan'], ['Verschil met plan', 'Difference from plan'],
  ['Verwacht over op lopende rekening', 'Expected left in current account'], ['Groei spaarrekening', 'Savings growth'],
  ['Naar beleggingsrekening', 'To investment account'], ['Extra aflossing ({})', 'Extra repayment ({})'],
  ['Totaal gespaard dit jaar', 'Total saved this year'], ['Gem. vrije uitgaven per maand', 'Avg. spending per month'],

  // grafiek maandbudgetten
  ['Uitgaven maandbudgetten per maand', 'Monthly budget spending per month'], ['tik op een maand', 'tap a month'],
  ['werkelijk', 'actual'], ['verwacht', 'expected'], ['doel', 'goal'], ['grens', 'limit'],
  ['Geen Dyme-gegevens — aangenomen als maandbudget ({}).', 'No Dyme data — assumed to equal the monthly budget ({}).'],
  ['Uitgegeven', 'Spent'], ['Tot nu toe', 'So far'], ['Verwacht', 'Expected'], ['Verwacht tot volgende salaris', 'Expected until next salary'],
  ['Doel · grens', 'Goal · limit'], ['Uitgaven maandbudgetten', 'Monthly budget spending'],

  // status
  ['op koers', 'on track'], ['boven doel', 'over goal'], ['boven grens', 'over limit'],
  ['doel {} · grens {}', 'goal {} · limit {}'], ['nog {}', '{} left'], ['{} over doel', '{} over goal'], ['maand', 'monthly'], ['rest', 'remainder'],

  // budgetten
  ['Deze periode', 'This period'], ['Dit jaar', 'This year'],
  ['{} Dyme-categorieën nog niet gekoppeld ({}).', '{} Dyme categories not linked yet ({}).'],
  ['{} Dyme-categorie nog niet gekoppeld ({}).', '{} Dyme category not linked yet ({}).'], ['Koppelen', 'Link'],
  ['Vrije ruimte beschikbaar · {} – {}', 'Available spending room · {} – {}'], ['Vrije ruimte deze periode', 'Spending room this period'],
  ['Maandbudgetten (in Dyme)', 'Monthly budgets (in Dyme)'], ['Jaarbudgetten uitgegeven', 'Yearly budgets spent'], ['Extra opgenomen', 'Extra withdrawn'],
  ['Storting {}', 'Deposit {}'], ['Saldo spaarrekening na storting', 'Savings balance after deposit'],
  ['Plus: je hebt nog ruimte voor jaarbudgetten. Min: je hebt deze periode meer uitgegeven dan je vrije ruimte.', 'Plus: you still have room for yearly budgets. Minus: you have spent more than your spending room this period.'],
  ['Spaarrekening deze periode', 'Savings this period'], ['Begint opnieuw bij elke salarisdag', 'Resets on every payday'],
  ['Startsaldo spaarrekening', 'Savings starting balance'], ['({}, na storting)', '({}, after deposit)'],
  ['Extra opgenomen van spaarrekening', 'Extra withdrawn from savings'], ['Extra uitgaven spaarrekening', 'Extra spending from savings'],
  ['Kasverschil', 'Cash difference'], ['Saldo spaarrekening nu', 'Savings balance now'],
  ['Prognose vrije ruimte {}', 'Spending room forecast {}'],
  ['Gemiddeld per maand · {} perioden', 'Average per month · {} periods'], ['Gemiddeld per maand · {} periode', 'Average per month · {} period'],
  ['Maandbudgetten', 'Monthly budgets'], ['Jaarbudgetten', 'Yearly budgets'], ['Vrije uitgaven', 'Discretionary spending'],
  ['Bij dit gemiddelde kom je dit jaar uit op {}. De prognose weegt dit mee en ligt daardoor hoger.', 'At this average you will end the year at {}. The forecast takes this into account and is higher as a result.'],
  ['Bij dit gemiddelde kom je dit jaar uit op {}. De prognose weegt dit mee en ligt daardoor lager.', 'At this average you will end the year at {}. The forecast takes this into account and is lower as a result.'],
  ['Bij dit gemiddelde kom je dit jaar uit op {}. De prognose weegt dit mee.', 'At this average you will end the year at {}. The forecast takes this into account.'],
  ['Jaarbudgetten {}', 'Yearly budgets {}'], ['Jaar verstreken', 'Year elapsed'], ['vandaag {}', 'today {}'], ['31 dec', '31 Dec'],
  ['zo ver is het jaar — vergelijk met de balk', 'how far the year is — compare with the bar'],
  ['Omvang', 'Size'], ['Soort', 'Type'], ['Overige uitgaven spaarrekening {}', 'Other savings spending {}'],
  ['Maandbudget toevoegen', 'Add monthly budget'], ['Jaarbudget toevoegen', 'Add yearly budget'],
  ['Nog geen budget. Lees er een in via Instellingen.', 'No budget yet. Import one in Settings.'],

  // maandplan
  ['Maandplan', 'Monthly plan'], ['Inkomsten {}', 'Income {}'], ['Overige inkomsten', 'Other income'],
  ['+ Overige inkomsten toevoegen', '+ Add other income'], ['Uitgaven {}', 'Expenses {}'], ['Vaste lasten', 'Fixed costs'],
  ['Overboekingen', 'Transfers'], ['Naar spaarrekening', 'To savings'], ['Vrije ruimte {}', 'Spending room {}'], ['Vrije ruimte', 'Spending room'],
  ['Maandbudgetten (doel · grens)', 'Monthly budgets (goal · limit)'], ['Jaarbudgetten lopende rekening (÷12)', 'Yearly budgets current account (÷12)'],
  ['Blijft op lopende rekening', 'Stays in current account'], ['Tik op een post om de bedragen per maand aan te passen.', 'Tap an item to adjust the amounts per month.'],
  ['Post toevoegen', 'Add item'], ['Inkomen', 'Income'], ['Overboeking', 'Transfer'],

  // spaarrekening
  ['Saldo per laatste salarisdag · {}', 'Balance on last payday · {}'], ['Inclusief storting', 'Including deposit'],
  ['Inclusief storting · sindsdien {} → nu {}', 'Including deposit · since then {} → now {}'],
  ['Inclusief storting · laatst ingevoerd {}', 'Including deposit · last entered {}'],
  ['Inclusief storting · sindsdien {} → nu {} · laatst ingevoerd {}', 'Including deposit · since then {} → now {} · last entered {}'],
  ['Saldo spaarrekening invoeren', 'Enter savings balance'], ['Verloop spaarrekening {}', 'Savings over {}'], ['{} verwacht', '{} expected'],
  ['prognose begin jaar', 'forecast at start of year'], ['prognose', 'forecast'], ['Verloop spaarrekening', 'Savings over time'],
  ['Prognose 31 december', 'Forecast 31 December'], ['Startsaldo (na storting jan)', 'Starting balance (after Jan deposit)'],
  ['Stortingen feb–dec', 'Deposits Feb–Dec'], ['Rente ({})', 'Interest ({})'], ['Opgenomen', 'Withdrawn'],
  ['Verwacht nog op te nemen', 'Expected withdrawals'], ['Uitgaven van spaarrekening', 'Spending from savings'],
  ['Verwacht nog uit jaarbudgetten', 'Expected from yearly budgets'], ['Prognose', 'Forecast'],
  ['{} overmaken', 'Transfer {}'], ['gedaan', 'done'], ['Uitgegeven dit jaar', 'Spent this year'], ['Mutaties {}', 'Transactions {}'],
  ['Opname naar lopende rekening', 'Withdrawal to current account'], ['Saldo ingevoerd', 'Balance entered'], ['Uitgave', 'Expense'],
  ['{} · kasverschil', '{} · cash difference'], ['kasverschil', 'cash difference'], ['van lopende rekening', 'from current account'],
  ['{} · van lopende rekening', '{} · from current account'], ['Nog geen mutaties', 'No transactions yet'],
  ['Gezamenlijke rekening (extra)', 'Joint account (extra)'], ['Belegging/Capex', 'Investment/Capex'],

  // instellingen
  ['Salaris op dag', 'Salary on day'], ['Saldo spaarrekening na storting januari', 'Savings balance after January deposit'],
  ['Rente spaarrekening (% per jaar)', 'Savings interest (% per year)'],
  ['Het startsaldo mag een schatting zijn; vul het exacte bedrag in zodra je het weet. Valt de salarisdag in het weekend of op een feestdag, dan geldt de werkdag ervoor.', 'The starting balance may be an estimate; enter the exact amount once you know it. If payday falls on a weekend or public holiday, the working day before applies.'],
  ['Salarisdagen {}', 'Paydays {}'], ['Prognose begin jaar opnieuw vastzetten', 'Reset forecast at start of year'],
  ['Nieuw boekjaar starten', 'Start new budget year'], ['Budget inlezen (CSV/Excel)', 'Import budget (CSV/Excel)'],
  ['Huidig budget exporteren', 'Export current budget'], ['Export inlezen', 'Import export'], ['Categorieën koppelen', 'Link categories'],
  ['Transacties wissen', 'Clear transactions'], ['Back-up maken', 'Create backup'], ['Back-up terugzetten', 'Restore backup'],
  ['Je gegevens staan alleen in deze app op dit toestel. Verwijder je de app van je beginscherm, dan zijn ze weg — maak dus af en toe een back-up (bijvoorbeeld naar iCloud Drive).', 'Your data is stored only in this app on this device. If you remove the app from your home screen, it is gone — so make a backup now and then (for example to iCloud Drive).'],
  ['Deze app maakt', 'This app makes'], ['geen internetverbinding', 'no internet connection'],
  ['. Een ingebouwde beveiligingsregel blokkeert elk netwerkverkeer; er is geen server en geen account.', '. A built-in security rule blocks all network traffic; there is no server and no account.'],
  ['Hoe werkt de prognose?', 'How does the forecast work?'], ['Demogegevens laden', 'Load demo data'], ['Alles wissen', 'Clear everything'],

  // sheets: mutaties
  ['Sluit', 'Close'], ['Annuleer', 'Cancel'], ['Annuleren', 'Cancel'], ['Bevestigen', 'Confirm'], ['Opslaan', 'Save'], ['Verwijderen', 'Delete'],
  ['Je hebt geld van je spaarrekening naar je lopende rekening overgemaakt omdat je niet uitkwam.', 'You transferred money from your savings to your current account because you ran short.'],
  ['Kies het budget of de spaarpost.', 'Choose the budget or savings item.'],
  ['Betaald van je lopende rekening', 'Paid from your current account'], ['Gaat van je spaarrekening af', 'Comes out of your savings'],
  ['Betaald van je lopende rekening · telt mee in je vrije ruimte', 'Paid from your current account · counts towards your spending room'],
  ['Gaat van je spaarrekening af · telt mee in je vrije ruimte', 'Comes out of your savings · counts towards your spending room'],
  ['Bedrag', 'Amount'], ['Datum', 'Date'], ['Notitie', 'Note'], ['optioneel', 'optional'], ['Mutatie', 'Transaction'], ['Opname', 'Withdrawal'],
  ['Saldo spaarrekening', 'Savings balance'],
  ['Vul het saldo in dat je nu in Trade Republic ziet. Het verschil met het berekende saldo wordt geboekt als', 'Enter the balance you currently see in Trade Republic. The difference from the calculated balance is recorded as'],
  [', en de prognose rekent vanaf het echte saldo verder.', ', and the forecast continues from the actual balance.'],
  ['Berekend saldo', 'Calculated balance'], ['Werkelijk saldo', 'Actual balance'], ['Kasverschil: {}', 'Cash difference: {}'],

  // sheets: posten en budgetten
  ['Nieuwe post', 'New item'], ['Naam', 'Name'], ['Vaste bedragen per maand', 'Fixed amounts per month'],
  ['Restpost: wat overblijft (alleen bij sparen)', 'Remainder: whatever is left (savings only)'],
  ['Dit bedrag rekent de app elke maand zelf uit: inkomen − vaste lasten − overboekingen − overig sparen − budget vrije ruimte. Pas je een budget aan, dan verandert deze storting mee.', 'The app calculates this amount every month: income − fixed costs − transfers − other savings − spending room budget. If you change a budget, this deposit changes with it.'],
  ['Bedrag voor meerdere maanden', 'Amount for several months'], ['Bedrag per maand', 'Amount per month'], ['jaar', 'year'], ['€ bedrag', '€ amount'],
  ['t/m', 'to'], ['Zet', 'Set'], ['Nieuw maandbudget', 'New monthly budget'], ['Doel per jaar', 'Goal per year'], ['Grens per jaar', 'Limit per year'],
  ['Gelijk over 12 maanden verdelen', 'Spread evenly over 12 months'], ['Doel voor meerdere maanden', 'Goal for several months'],
  ['Grens voor meerdere maanden', 'Limit for several months'], ['Doel per maand', 'Goal per month'], ['Grens per maand', 'Limit per month'],
  ['Dyme-categorieën: {} (aanpassen via Instellingen → Categorieën koppelen).', 'Dyme categories: {} (change via Settings → Link categories).'],
  ['nog geen', 'none yet'], ['Nieuw jaarbudget', 'New yearly budget'],
  ['Kasverschil ontstaat vanzelf wanneer je het echte saldo van je spaarrekening invoert.', 'A cash difference arises automatically when you enter the actual balance of your savings account.'],
  ['Betaald van', 'Paid from'], ['Lopende rekening', 'Current account'], ['Hoort bij vrije ruimte', 'Part of spending room'],
  ['Ja — jaarbudget binnen je € per maand', 'Yes — yearly budget within your € per month'], ['Nee — aparte spaarpost', 'No — separate savings item'],
  ['Met een doel telt het resterende bedrag mee in de prognose: verspreid over het jaar bij de vrije ruimte, in december bij een aparte spaarpost (zoals Huis). Laat leeg om alleen bij te houden.', 'With a goal, the remaining amount counts in the forecast: spread over the year for spending room, in December for a separate savings item (such as House). Leave empty to only track it.'],
  ['Overige inkomsten toevoegen', 'Add other income'], ['Omschrijving', 'Description'], ['bijv. teruggave belasting', 'e.g. tax refund'],
  ['Maand', 'Month'], ['Bedrag (netto)', 'Amount (net)'],
  ['Telt mee als inkomen in die maand. Via de restpost gaat het automatisch naar je spaarrekening.', 'Counts as income in that month. Through the remainder item it goes to your savings automatically.'],

  // sheets: Dyme
  ['Dyme-categorieën', 'Dyme categories'], ['— Kies —', '— Choose —'], ['Negeren', 'Ignore'],
  ['Koppel elke Dyme-categorie aan een maandbudget. Kies ‘Negeren’ voor inkomsten, overboekingen of uitgaven die je in de app als jaarbudget bijhoudt (zoals vakantie).', 'Link each Dyme category to a monthly budget. Choose ‘Ignore’ for income, transfers or spending you track in the app as a yearly budget (such as holidays).'],
  ['Nog geen transacties ingelezen.', 'No transactions imported yet.'],
  ['{} regels gevonden. Controleer welke kolom wat is.', '{} rows found. Check which column is which.'],
  ['Hoofdcategorie', 'Main category'], ['Categorie', 'Category'], ['Uitgaven zijn', 'Expenses are'],
  ['negatief (−)', 'negative (−)'], ['alle bedragen', 'all amounts'], ['— geen —', '— none —'],
  ['Nog geen geldige regels — pas de kolommen aan.', 'No valid rows yet — adjust the columns.'],
  ['{} geldig. Positieve bedragen in een gekoppelde categorie tellen als terugbetaling.', '{} valid. Positive amounts in a linked category count as refunds.'],
  ['{} geldig · {} overgeslagen (geen datum of bedrag). Positieve bedragen in een gekoppelde categorie tellen als terugbetaling.', '{} valid · {} skipped (no date or amount). Positive amounts in a linked category count as refunds.'],
  ['Verder', 'Next'], ['Nieuwe categorieën', 'New categories'],
  ['Deze Dyme-categorieën ken ik nog niet. Koppel ze aan een maandbudget; dit wordt onthouden.', 'These Dyme categories are new. Link them to a monthly budget; this will be remembered.'],
  ['Importeren', 'Import'],

  // sheets: budget inlezen
  ['Inkomen (incl. {}× overige inkomsten)', 'Income (incl. {}× other income)'], ['Naar spaarrekening (incl. restpost)', 'To savings (incl. remainder)'],
  ['Maandbudgetten ({})', 'Monthly budgets ({})'], ['Jaarbudgetten ({})', 'Yearly budgets ({})'], ['Spaarposten ({})', 'Savings items ({})'],
  ['Dyme-categorieën negeren', 'Ignored Dyme categories'], ['Let op: vrije ruimte en budgetten verschillen {}.', 'Note: spending room and budgets differ by {}.'],
  ['Overgeslagen: {}', 'Skipped: {}'],
  ['Je huidige budget wordt vervangen. Dyme-transacties, koppelingen en mutaties blijven bewaard.', 'Your current budget will be replaced. Dyme transactions, links and transactions are kept.'],

  // bevestigingen
  ['Demogegevens laden?', 'Load demo data?'], ['Je eigen gegevens worden vervangen. Maak eerst een back-up.', 'Your own data will be replaced. Make a backup first.'],
  ['Alles wissen?', 'Clear everything?'], ['De demogegevens worden verwijderd.', 'The demo data will be deleted.'],
  ['Al je budgetten, transacties en mutaties worden van dit toestel verwijderd.', 'All your budgets, transactions and entries will be deleted from this device.'],
  ['Transacties wissen?', 'Clear transactions?'],
  ['Alle ingelezen Dyme-transacties worden verwijderd. Budgetten, koppelingen en mutaties blijven.', 'All imported Dyme transactions will be deleted. Budgets, links and entries are kept.'],
  ['Prognose begin jaar vastzetten?', 'Reset forecast at start of year?'],
  ['De lijn "prognose begin jaar" in de grafiek wordt vervangen door je huidige plan.', 'The "forecast at start of year" line in the chart will be replaced by your current plan.'],
  ['De prognose voor 31 december wordt het voorlopige startsaldo; pas het aan zodra je het echte saldo weet. Je budget blijft staan; lees daarna je nieuwe budget in of pas het aan.', 'The forecast for 31 December becomes the provisional starting balance; adjust it once you know the actual balance. Your budget stays; then import your new budget or adjust it.'],

  // uitleg prognose
  ['1. Maandbudgetten (Dyme).', '1. Monthly budgets (Dyme).'],
  ['Per budget kijkt de app naar je uitgaven in de afgelopen perioden; recente maanden tellen zwaarder. Met weinig data wordt de voorspelling naar je doel getrokken, met meer data vertrouwt de app op je eigen patroon. In de lopende periode telt wat je al uitgaf plus de verwachting tot je volgende salaris.', 'For each budget the app looks at your spending in past periods; recent months weigh more. With little data the prediction is pulled towards your goal; with more data the app relies on your own pattern. In the current period it counts what you already spent plus the expectation until your next salary.'],
  ['2. Jaarbudgetten.', '2. Yearly budgets.'],
  ['Voor bijv. vakantie of Vinci kijkt de app half naar wat er nog in het budget zit en half naar je tempo tot nu toe (zodra een kwart van het jaar voorbij is). Aparte spaarposten met een budget (zoals Huis) verwacht de app in december.', 'For e.g. holidays or Vinci the app looks half at what is left in the budget and half at your pace so far (once a quarter of the year has passed). Separate savings items with a budget (such as House) are expected in December.'],
  ['3. Gemiddelde als controle.', '3. Average as a check.'],
  ['Daarnaast berekent de app je gemiddelde vrije uitgaven per maand (Dyme en jaarbudgetten samen) en trekt dat door naar het einde van het jaar. Wijkt dat af van de optelsom per budget, dan schuift de prognose die kant op — hoe meer maanden data, hoe zwaarder (tot maximaal de helft).', 'The app also calculates your average discretionary spending per month (Dyme and yearly budgets together) and extends it to the end of the year. If that differs from the sum per budget, the forecast shifts that way — the more months of data, the more weight (up to half).'],
  ['4. Lopende rekening.', '4. Current account.'],
  ['Per periode: vrije ruimte − Dyme − jaarbudgetten die je van je lopende rekening betaalt. Een overschot blijft op je lopende rekening staan en vangt latere tekorten op. Wordt het saldo negatief, dan rekent de app met een opname van je spaarrekening.', 'Per period: spending room − Dyme − yearly budgets paid from your current account. A surplus stays in your current account and covers later shortfalls. If the balance turns negative, the app assumes a withdrawal from your savings.'],
  ['5. Spaarrekening 31 december', '5. Savings on 31 December'],
  ['= startsaldo + stortingen + rente − opnames − uitgaven van de spaarrekening ± kasverschil (gedaan en verwacht).', '= starting balance + deposits + interest − withdrawals − spending from savings ± cash difference (actual and expected).'],
  ['6. Saldo invoeren.', '6. Entering the balance.'],
  ['Na elk salaris kun je het echte saldo invoeren; het verschil wordt Kasverschil en de prognose rekent vanaf het echte saldo verder.', 'After each salary you can enter the actual balance; the difference becomes Cash difference and the forecast continues from the actual balance.'],
  ['Bandbreedte.', 'Range.'],
  ['Op basis van hoe sterk je uitgaven aan maandbudgetten schommelen (ca. 80% zekerheid).', 'Based on how much your monthly budget spending fluctuates (approx. 80% certainty).'],

  // meldingen
  ['Opgeslagen', 'Saved'], ['Opname opgeslagen', 'Withdrawal saved'], ['Uitgave opgeslagen', 'Expense saved'], ['Verwijderd', 'Deleted'],
  ['Vul een bedrag in', 'Enter an amount'], ['Vul een datum in', 'Enter a date'], ['Vul een naam in', 'Enter a name'], ['Vul het saldo in', 'Enter the balance'],
  ['Saldo klopt precies', 'Balance matches exactly'], ['Kasverschil {} geboekt', 'Cash difference {} recorded'],
  ['{} t/m {} aangepast — vergeet niet op te slaan', '{} to {} updated — remember to save'],
  ['{} nieuwe transacties', '{} new transactions'], ['{} nieuwe transacties · {} al aanwezig', '{} new transactions · {} already present'],
  ['Koppelingen opgeslagen', 'Links saved'], ['Budget ingelezen', 'Budget imported'], ['Demo geladen', 'Demo loaded'], ['Gewist', 'Cleared'],
  ['Transacties gewist', 'Transactions cleared'], ['Vastgezet', 'Reset'], ['Back-up teruggezet', 'Backup restored'],
  ['Back-up ongeldig: {}', 'Invalid backup: {}'], ['onbekend formaat', 'unknown format'], ['Bestand is leeg', 'File is empty'],
  ['Kon bestand niet lezen: {}', 'Could not read file: {}'], ['Geen geldig Excel-bestand', 'Not a valid Excel file'], ['Geen werkblad gevonden', 'No worksheet found'],
  ['Geen budgetregels gevonden', 'No budget rows found'], ['Kolommen Soort en Categorie niet gevonden — gebruik het sjabloon', 'Columns Type and Category not found — use the template'],
  ['Er staan nog mutaties op deze post', 'This item still has transactions'], ['Opslaan mislukt — maak een back-up', 'Saving failed — make a backup'],
  ['Boekjaar {}', 'Budget year {}']
];
