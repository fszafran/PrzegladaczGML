import { useEffect } from 'react';
import '../assets/style.css';
import gmlParser from '../utils/gmlParser';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
import mapUtils from '../utils/mapUtils';

const MapView = ({ parsedGML }) => {
  useEffect(() => {
    const map = mapUtils.initializeMap();

    // Dodanie kontenera dla pop-upu
    const popupContainer = document.createElement('div');
    popupContainer.className = 'ol-popup';
    const popupContent = document.createElement('div');
    popupContainer.appendChild(popupContent);
    const closer = document.createElement('a');
    closer.className = 'ol-popup-closer';
    closer.href = '#';
    closer.onclick = () => {
      overlay.setPosition(undefined);
      return false;
    };
    popupContainer.appendChild(closer);
    document.body.appendChild(popupContainer);

    const overlay = new Overlay({
      element: popupContainer,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    });
    map.addOverlay(overlay);

    const displayPopup = (feature, coordinate) => {
      const properties = feature.getProperties();
      
      // Dodajemy log do konsoli, żeby zobaczyć całą strukturę danych
      console.log(properties); // Zobaczysz pełną strukturę obiektu
      
      // Tworzymy zmienną do przechowywania treści HTML
      let contentHTML = `<div><h3>Szczegóły działki</h3>`;
      
      // Sprawdzamy i dodajemy odpowiednie atrybuty
      if (properties.startObiekt) {
        contentHTML += `<p><strong>Start obiektu:</strong> ${properties.startObiekt || 'Brak'}</p>`;
      }
      if (properties.startWersjaObiekt) {
        contentHTML += `<p><strong>Start wersji obiektu:</strong> ${properties.startWersjaObiekt || 'Brak'}</p>`;
      }
      if (properties.podstawaUtworzeniaWersjiObiektu) {
        contentHTML += `<p><strong>Podstawa utworzenia wersji obiektu:</strong> <a href="${properties.podstawaUtworzeniaWersjiObiektu}" target="_blank">Link</a></p>`;
      }
      if (properties.egb_EGB_OsobaFizyczna) {
        const osoba = properties.egb_EGB_OsobaFizyczna;
        contentHTML += `<p><strong>Imię:</strong> ${osoba.pierwszeImie || 'Brak'}</p>`;
      }
      
      
      // Sprawdzamy pozostałe właściwości
      for (const [key, value] of Object.entries(properties)) {
        // Pomiń 'geometry', bo nie chcesz jej wyświetlać
        if (key === 'geometria') {
          continue;
        }
        // Wyświetlamy pozostałe właściwości (poza tymi, które już dodaliśmy)
        if (value && typeof value === 'object') {
          contentHTML += `
            <p><strong>${key}:</strong> ${JSON.stringify(value)}</p>
          `;
        } else {
          contentHTML += `
            <p><strong>${key}:</strong> ${value || 'Brak'}</p>
          `;
        }
      }
      
      // Zamykamy div
      contentHTML += `</div>`;
      
      // Ustawiamy zawartość popup
      popupContent.innerHTML = contentHTML;
      
      // Ustawiamy pozycję popup
      overlay.setPosition(coordinate);
    };
    


    
    

    if (parsedGML && parsedGML.length > 0) {
      const chosenCRS = gmlParser.gml3Format.srsName;
      const validFeatures = parsedGML.filter((f) => f && f.getGeometry());
      const transformedFeatures = mapUtils.transformFeaturesToWGS84(chosenCRS, validFeatures);

      const vectorSource = new VectorSource({
        features: transformedFeatures,
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.1)',
          }),
          stroke: new Stroke({
            color: '#ff0000',
            width: 2,
          }),
        }),
      });

      map.addLayer(vectorLayer);

      if (vectorSource.getExtent()) {
        map.getView().fit(vectorSource.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 18,
        });
      }

      // Dodanie logiki obsługi kliknięcia i wyświetlania pop-upu
      map.on('singleclick', (event) => {
        map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const coordinate = event.coordinate;
          displayPopup(feature, coordinate);
          return true; // Przerwij iterację po znalezieniu działki
        });
      });
    }

    return () => {
      map.setTarget(null);
      map.dispose();

      // Usuń pop-up po zamknięciu komponentu
      popupContainer.remove();
    };
  }, [parsedGML]);

  return null; // Komponent nie renderuje nic wizualnego
};

export default MapView;
