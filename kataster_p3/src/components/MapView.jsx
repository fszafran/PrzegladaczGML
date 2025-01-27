import { useState, useEffect } from 'react'
import '../assets/style.css'
import gmlParser from '../utils/gmlParser'
import mapUtils from '../utils/mapUtils'
import VectorSource from 'ol/source/Vector'
import Overlay from 'ol/Overlay'
import LayerControl from './LayerControl'

const MapView = ({ parsedGML }) => {
  const [layers, setLayers] = useState({})
  const [controlKey, setControlKey] = useState(0)

  
  
  useEffect(() => {
    
    setControlKey(Date.now()) //fake state zeby zmusic layerControl do rerenderu
    const map = mapUtils.initializeMap()
    const popupContainer = document.createElement('div')
    popupContainer.className = 'ol-popup'
    const popupContent = document.createElement('div')
    popupContainer.appendChild(popupContent)
    const closer = document.createElement('a')
    closer.className = 'ol-popup-closer'
    closer.href = '#'
    closer.onclick = () => {
      overlay.setPosition(undefined)
      return false
    }
    popupContainer.appendChild(closer)
    document.body.appendChild(popupContainer)

    const overlay = new Overlay({
      element: popupContainer,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    })
    map.addOverlay(overlay)





    const displayPopup = (feature, coordinate) => {
      const properties = feature.getProperties();
      console.log(properties);
    
      let contentHTML = `<div><h3>Szczegóły Obietku</h3>`;
      let wlascicieleDodani = false; // Flaga dla właścicieli
      let klasouzytekDodany = false; // Flaga dla użytków
      let poledodane = false;
      let dokladnosc = false;
      let polellel = false;
      if (properties.startObiekt) {
        contentHTML += `<p><strong>Start obiektu:</strong> ${properties.startObiekt || 'Brak'}</p>`;
      }
      
      if (properties.startWersjaObiekt) {
        contentHTML += `<p><strong>Start wersji obiektu:</strong> ${properties.startWersjaObiekt || 'Brak'}</p>`;
      }
      


      if (properties.egb_EGB_OsobaFizyczna) {
        const osoba = properties.egb_EGB_OsobaFizyczna;
        contentHTML += `<p><strong>Imię:</strong> ${osoba.pierwszeImie || 'Brak'}</p>`;
      }
      const keysToSkip = [
        'geometria',
        'startObiekt',
        'startWersjaObiekt',
        'podstawaUtworzeniaWersjiObiektu',
        'dzialkaZabudowana',
        'adresBudynku',
        'operatTechniczny2',
        'JRG2',
        'adresDzialki',
        'lokalizacjaDzialki',
        'punktGranicyDzialki',
        'idIIP',
        'lokalizacjaKonturu',
        'lokalizacjaUzytku',
        'powZabudowy',
        'klasouzytek',
        'wlasciciele',
        'poleEwidencyjne',
      ];
      for (const [key, value] of Object.entries(properties)) {
        if (keysToSkip.includes(key)) {
          continue;
        }
        if (key === 'oldCoordinatesIn2178' && Array.isArray(value)) {
          if (value.length === 3) { // Obsługujemy minimum 2 współrzędne
            const [x, y] = value; // Wyciągamy dwie współrzędne
            contentHTML += `<p><strong>Współrzędne punktu:</strong> (${x}, ${y})</p>`;
          }
          continue; // Pomijamy dalsze przetwarzanie tego klucza
        }

          // Wyświetlanie pola ewidencyjnego
        if (!poledodane && properties.poleEwidencyjne) {
          if (properties.poleEwidencyjne && typeof properties.poleEwidencyjne === 'object') {
            const value = properties.poleEwidencyjne._content_;
            const unit = properties.poleEwidencyjne.uom || 'm²';
            contentHTML += `<p><strong>Pole ewidencyjne:</strong> ${value} ${unit}</p>`;
          }
          poledodane = true; // Oznacz pole ewidencyjne jako dodane
        }

        // Wyświetlanie dokładności reprezentacji pola
        if (!dokladnosc && properties.dokladnoscReprezentacjiPola) {
          if (properties.dokladnoscReprezentacjiPola) {
            contentHTML += `<p><strong>Dokładność reprezentacji pola:</strong> ${properties.dokladnoscReprezentacjiPola}</p>`;
          }
          dokladnosc = true;
        }


          // Wyświetlanie właścicieli
        if (!wlascicieleDodani && properties.wlasciciele && Array.isArray(properties.wlasciciele)) {
          contentHTML += `<p><strong>Właściciele:</strong></p><ul>`;
          properties.wlasciciele.forEach((wlasciciel) => {
            if (wlasciciel.typ === 'Instytucja' && wlasciciel.nazwaPelna) {
              contentHTML += `<li>${wlasciciel.nazwaPelna}</li>`;
            } else if (wlasciciel.typ === 'malzenstwo' && wlasciciel.osoba1 && wlasciciel.osoba2) {
              contentHTML += `<li>Małżeństwo: ${wlasciciel.osoba1.imie} ${wlasciciel.osoba1.nazwisko} i ${wlasciciel.osoba2.imie} ${wlasciciel.osoba2.nazwisko}</li>`;
            } else if (wlasciciel.osoba1) {
              contentHTML += `<li>${wlasciciel.osoba1.imie} ${wlasciciel.osoba1.nazwisko}</li>`;
            }
          });
          contentHTML += `</ul>`;
          wlascicieleDodani = true; // Oznacz właścicieli jako dodanych
        }
        // Obsługa klasoużytków
        if (!klasouzytekDodany && properties.klasouzytek) {
          // Jeśli `klasouzytek` jest tablicą, iterujemy
          if (Array.isArray(properties.klasouzytek)) {
            contentHTML += `<p><strong>Klasoużytki:</strong></p><ul>`;
            properties.klasouzytek.forEach((item) => {
              const klasouzytek = item.EGB_Klasouzytek;
              if (klasouzytek) {
                const ofu = klasouzytek.OFU || 'Brak';
                const ozu = klasouzytek.OZU || 'Brak';
                const ozk = klasouzytek.OZK || 'Brak';
                const powierzchnia = klasouzytek.powierzchnia?._content_ || 'Brak';
                const jednostka = klasouzytek.powierzchnia?.uom || 'm²';
                contentHTML += `<li>OFU: ${ofu}, OZU: ${ozu}, OZK: ${ozk}, Powierzchnia: ${powierzchnia} ${jednostka}</li>`;
              }
            });
            contentHTML += `</ul>`;
          } else {
            // Jeśli `klasouzytek` jest pojedynczym obiektem
            const klasouzytek = properties.klasouzytek.EGB_Klasouzytek;
            if (klasouzytek) {
              const ofu = klasouzytek.OFU || 'Brak';
              const ozu = klasouzytek.OZU || 'Brak';
              const ozk = klasouzytek.OZK || 'Brak';
              const powierzchnia = klasouzytek.powierzchnia?._content_ || 'Brak';
              const jednostka = klasouzytek.powierzchnia?.uom || 'm²';
              contentHTML += `<p><strong>Klasoużytek:</strong> OFU: ${ofu}, OZU: ${ozu}, OZK: ${ozk}, Powierzchnia: ${powierzchnia} ${jednostka}</p>`;
            }
          }
          klasouzytekDodany = true; // Oznacz klasoużytki jako dodane
        }

        // Wyświetlanie użytkó
        // Obsługa powierzchni zabudowy
        if (!polellel && properties.powZabudowy) {
          if (properties.powZabudowy && typeof properties.powZabudowy === 'object') {
            const value = properties.powZabudowy._content_;
            const unit = properties.powZabudowy.uom;
            if (value && unit) {
              contentHTML += `<p><strong>Powierzchnia zabudowy:</strong> ${value} ${unit}</p>`;
            } else if (value) {
              contentHTML += `<p><strong>Powierzchnia zabudowy:</strong> ${value} m²</p>`;
            }
          }
          polellel = true; // Oznacz pole ewidencyjne jako dodane
        }
    
        if (value && typeof value === 'object') {
          contentHTML += `<p><strong>${key}:</strong> ${JSON.stringify(value)}</p>`;
        } else {
          contentHTML += `<p><strong>${key}:</strong> ${value || 'Brak'}</p>`;
        }
      }
    
      contentHTML += `</div>`;
    
      popupContent.innerHTML = contentHTML;
      overlay.setPosition(coordinate);
    };
    
    
    
  
    if (parsedGML && parsedGML.length > 0) {
      mapUtils.addOwnerAttribute(parsedGML) 
      
      const chosenCRS = gmlParser.gml3Format.srsName
      const feautesWithGeometries = parsedGML.filter((f) => f && f.getGeometry())
      const transformedFeatures = mapUtils.transformFeaturesToWGS84(chosenCRS, feautesWithGeometries)
      
      const [budynkiLayer, dzialkiLayer, uzytkiLayer, konturyLayer, punktyGraniczneLayer] = mapUtils.getLayersFromFeatures(transformedFeatures)
      
      map.addLayer(dzialkiLayer)
      map.addLayer(uzytkiLayer)
      map.addLayer(konturyLayer)
      map.addLayer(punktyGraniczneLayer)
      map.addLayer(budynkiLayer)

      setLayers({
        budynki: budynkiLayer,
        dzialki: dzialkiLayer,
        uzytki: uzytkiLayer,
        kontury: konturyLayer,
        punktyGraniczne: punktyGraniczneLayer
      })

      const vectorSource = new VectorSource({
        features: transformedFeatures
      })

      if (vectorSource.getExtent()) {
        map.getView().fit(vectorSource.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 18
        })
      }

      map.on('singleclick', (event) => {
        map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const coordinate = event.coordinate
          displayPopup(feature, coordinate)
          return true
        })
      })
    }

    return () => {
      map.setTarget(null)
      map.dispose()
      popupContainer.remove()
    }
  }, [parsedGML])

  const toggleLayerVisibility = (layerKey) => {
    const layer = layers[layerKey]
    if (layer) {
      const isVisible = layer.getVisible()
      layer.setVisible(!isVisible)
    }
  }
  
  return (
    <>
    {parsedGML && parsedGML.length > 0 && (
      <LayerControl key={controlKey} onChange={toggleLayerVisibility} />
    )}
  </>
  )
  
}

export default MapView
