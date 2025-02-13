import { useGeographic } from 'ol/proj'
import Map from 'ol/Map.js'
import OSM from 'ol/source/OSM.js'
import TileLayer from 'ol/layer/Tile.js'
import View from 'ol/View.js'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Fill, Stroke } from 'ol/style'
import CircleStyle from 'ol/style/Circle'

const swapCoordinates = (coords) => {
    const result = []
    for (let i = 0; i < coords.length; i += 3) {
      result.push(coords[i + 1])
      result.push(coords[i])   
      result.push(coords[i + 2])
    }
    return result
}

const initializeMap = () => {
    useGeographic()
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [19, 52],
        zoom: 7,
      }),
    })
    return map
}

// dodaj nowy atrybut, ktory zapisuje stara geometrie
const transformFeaturesToWGS84 = (fromCRS, features) => {
    const wgsCRS = 'EPSG:4326'
    features.forEach(feature => {
        const geometry = feature.getGeometry();
        const coords = geometry.flatCoordinates;
        // dodanie atrybutu starej geometrii
        feature.set('oldCoordinatesIn2178', coords);
        geometry.flatCoordinates = swapCoordinates(coords);
        geometry.transform(fromCRS, wgsCRS)
    });
    return features
}

const colors = [
  {fill: 'rgba(255, 0, 0, 0.5)', stroke: '#ff0000'},    // Red
  {fill: 'rgba(0, 128, 0, 0.6)', stroke: '#008000'},    // Green
  {fill: 'rgba(0, 0, 255, 0.7)', stroke: '#0000ff'},    // Blue
  {fill: 'rgba(255, 165, 0, 0.1)', stroke: '#ffa500'},  // Orange
  {fill: 'rgba(255, 255, 0, 0.1)', stroke: '#ffff00'}   // Yellow
]

const createVectorLayer = (sourceFeatures, colorIndex) => {

  const chosenColor = colors[colorIndex]
  
  const vectorSource = new VectorSource({
    features: sourceFeatures,
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      fill: new Fill({
        color: chosenColor.fill,
      }),
      stroke: new Stroke({
        color: chosenColor.stroke,
        width: 2,
      }),
    }),
  })
  return vectorLayer
}
const createPointLayer = (sourceFeatures, colorIndex) => {
  const chosenColor = colors[colorIndex]
  const vectorSource = new VectorSource({
    features: sourceFeatures,
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: chosenColor.fill,
        }),
        stroke: new Stroke({
          color: chosenColor.stroke,
          width: 2,
        }),
      }),
    }),
  })

  return vectorLayer
}

const getLayersFromFeatures = (features) => {

  const budynkiLayer = createVectorLayer(
    features.filter((f) => f.getKeys().includes('idBudynku')),
    0
  )
  const dzialkiLayer = createVectorLayer(
    features.filter((f) => f.getKeys().includes('idDzialki')),
    1
  )
  const uzytkiLayer = createVectorLayer(
    features.filter((f) => f.getKeys().includes('idUzytku')),
    2
  )
  const konturyLayer = createVectorLayer(
    features.filter((f) => f.getKeys().includes('idKonturu')),
    3
  )
  const punktyGraniczneLayer = createPointLayer(
    features.filter((f) => f.getKeys().includes('idPunktu')),
    4
  )
  return [budynkiLayer, dzialkiLayer, uzytkiLayer, konturyLayer, punktyGraniczneLayer]
}


const getPersonOrInstitutionDetails = (dzialkaId, features) => {
  // Znajdź działkę po ID
  const dzialka = features.find(
    (feature) => feature.getId() === dzialkaId
  );

  if (!dzialka) {
    console.error(`Działka o ID ${dzialkaId} nie została znaleziona.`)
    return null
  }

  // Pobierz id_jrg2 z atrybutu xlink:href
  const jrg2Id = dzialka.get('JRG2')?.['xlink:href']
  if (!jrg2Id) {
    console.error(`Działka o ID ${dzialkaId} nie ma atrybutu JRG2.`)
    return null
  }

  // Znajdź wszystkie obiekty w EGB_UdzialWeWlasnosci, które pasują do jrg2Id
  // szukanie obiektow przez rodzajPrawa, atrybut tylko w EGB_UdzialWeWlasnosci
  const udzialyWeWlasnosci = features.filter((feature) => {
    const przedmiot = feature.get('przedmiotUdzialuWlasnosci')
    return przedmiot?.EGB_JednostkaRejestrowa?.['_content_']?.JRG?.['xlink:href'] === jrg2Id
  })
  
  

  if (udzialyWeWlasnosci.length === 0) {
    console.error(`Nie znaleziono obiektów w EGB_UdzialWeWlasnosci dla ID ${jrg2Id}.`)
    return null
  }

  const results = []

  // Przetwarzanie każdego udziału we własności
  udzialyWeWlasnosci.forEach((udzialWeWlasnosci) => {
    const osobaFizycznaId = udzialWeWlasnosci.get('podmiotUdzialuWlasnosci').EGB_Podmiot?.['_content_'].osobaFizyczna?.['xlink:href']
    const malzenstwoId = udzialWeWlasnosci.get('podmiotUdzialuWlasnosci').EGB_Podmiot?.['_content_'].malzenstwo?.['xlink:href']
    const instytucjaId = udzialWeWlasnosci.get('podmiotUdzialuWlasnosci').EGB_Podmiot?.['_content_'].instytucja1?.['xlink:href']

    // Obsługa przypadku OsobaFizyczna
    if (osobaFizycznaId) {
      const osobaFizyczna = features.find(
        (feature) =>
          feature.getId() === osobaFizycznaId
      )
      if (osobaFizyczna) {
        results.push({
          typ: 'OsobaFizyczna',
          imie: osobaFizyczna.get('pierwszeImie'),
          nazwisko: osobaFizyczna.get('pierwszyCzlonNazwiska'),
        })
      }
    }

    // Obsługa przypadku Malzenstwo
    if (malzenstwoId) {
      const malzenstwo = features.find(
        (feature) =>
          feature.getId() === malzenstwoId
      )

      if (malzenstwo) {
        console.log(malzenstwo)
        const osoba1Id = malzenstwo.get('osobaFizyczna2')?.['xlink:href']
        const osoba2Id = malzenstwo.get('osobaFizyczna3')?.['xlink:href']
        const osoba1 = features.find(
          (feature) =>
            feature.getId() === osoba1Id
        )
        const osoba2 = features.find(
          (feature) =>
            feature.getId() === osoba2Id
        )

        results.push({
          typ: 'malzenstwo',
          osoba1: osoba1
            ? { imie: osoba1.get('pierwszeImie'), nazwisko: osoba1.get('pierwszyCzlonNazwiska') }
            : null,
          osoba2: osoba2
            ? { imie: osoba2.get('pierwszeImie'), nazwisko: osoba2.get('pierwszyCzlonNazwiska') }
            : null,
        });
      }
    }

    // Obsługa przypadku Instytucja
    if (instytucjaId) {
      const instytucja = features.find(
        (feature) =>
          feature.getId() === instytucjaId
      );
      if (instytucja) {
        results.push({
          typ: 'Instytucja',
          nazwaPelna: instytucja.get('nazwaPelna'),
        });
      }
    }
  });

  // Jeśli nie znaleziono żadnych wyników
  if (results.length === 0) {
    console.error(`Nie znaleziono powiązanych danych dla działki o ID ${dzialkaId}.`);
    return null;
  }

  // Zwróć listę wyników
  return results;
}

const addOwnerAttribute = (features) =>{
  const dzialki = features.filter(
    (feature) =>
      feature.getKeys().includes('idDzialki')      
  )
  dzialki.forEach((dzialka) => {
    const owners = getPersonOrInstitutionDetails(dzialka.getId(), features) 
    // czy silent? narazie jest cicho, bez event
    dzialka.set('wlasciciele', owners, true)
  });
}
export default { swapCoordinates, initializeMap, transformFeaturesToWGS84, getLayersFromFeatures, addOwnerAttribute}