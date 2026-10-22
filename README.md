# Proportzioak

Proportzionaltasun zuzena eta alderantzizkoa bereizteko webgune interaktiboa, **guztiz euskaraz**.

## Zer eskaintzen du?

- Eguneroko **30 egoera**: 15 proportzionaltasun zuzenekoak eta 15 alderantzizkoak.
- Bi erantzun aukeran, berehalako zuzenketa eta egoera bakoitzaren azalpena.
- Hiru balio pare dituen adibide taula, adibide landua eta konstantearen formula.
- Egoera bakoitzeko problema bat: botoia sakatzean, hiruko erregelarekin pausoz pauso ebatzita ikusten da, datu taula, erlazioa, eragiketak eta unitatedun erantzuna barne.
- Aurrerapena, zuzenen eta okerren kopurua, eta amaierako emaitzak.
- Okerren azalpenak errepasatzeko aukera eta egoerak nahastuta berriro hasteko aukera.
- Nabigatzailean automatikoki gordetako aurrerapena. Datuak ez dira zerbitzari batera bidaltzen.
- Mugikorretarako diseinua, teklatu bidezko erabilera eta pantaila irakurgailuetarako etiketak.

## Erabili

Webgunea: **https://atella232.github.io/proportzioak/**

Tokian irekitzeko, karpeta honetan HTTP zerbitzari bat abiarazi:

```sh
python3 -m http.server 8000
```

Ondoren, ireki `http://localhost:8000`. Ez da instalaziorik edo eraikuntza pausorik behar.

## Fitxategiak

- `index.html`: orria eta laguntza leihoak.
- `styles.css`: diseinu moldagarria.
- `app.js`: saioa, erantzunen zuzenketa, nabigazioa eta aurrerapenaren gordetzea.
- `questions.js`: 30 egoeren edukia.
- `problems.js`: 30 problemaren enuntziatuak, datuak eta erantzunak.
- `tests/content.test.js`: edukien egitura, oreka eta proportzionaltasun matematikoa egiaztatzeko probak.

## Egiaztatu

Node.js erabilgarri baduzu:

```sh
npm run check
```

Teklatuko `1` eta `2` teklek erantzun aukerak hautatzen dituzte. `Tab` teklak botoien artean mugitzen du fokua, eta `Esc` teklak laguntza leihoa ixten du.

## Argitaratu

GitHub Pages-en konfigurazioa: `main` adarra, `/ (root)` karpeta. `main` adarrean egindako aldaketak automatikoki argitaratzen dira.
