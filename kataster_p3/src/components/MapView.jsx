import { useState, useEffect } from 'react'
import '../assets/style.css'
import gmlParser from '../utils/gmlParser'
import mapUtils from '../utils/mapUtils'
import VectorSource from 'ol/source/Vector'
import Overlay from 'ol/Overlay' // Import brakującej klasy

const MapView = ({ parsedGML }) => {
  const [map, setMap] = useState(null)
  const [layers, setLayers] = useState({})

  useEffect(() => {
    const initializedMap = mapUtils.initializeMap()
    setMap(initializedMap)

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
    initializedMap.addOverlay(overlay)

    const displayPopup = (feature, coordinate) => {
      const properties = feature.getProperties()
      console.log(properties)

      let contentHTML = `<div><h3>Szczegóły działki</h3>`
      if (properties.startObiekt) {
        contentHTML += `<p><strong>Start obiektu:</strong> ${properties.startObiekt || 'Brak'}</p>`
      }
      if (properties.startWersjaObiekt) {
        contentHTML += `<p><strong>Start wersji obiektu:</strong> ${properties.startWersjaObiekt || 'Brak'}</p>`
      }
      if (properties.podstawaUtworzeniaWersjiObiektu) {
        contentHTML += `<p><strong>Podstawa utworzenia wersji obiektu:</strong> <a href="${properties.podstawaUtworzeniaWersjiObiektu}" target="_blank">Link</a></p>`
      }
      if (properties.egb_EGB_OsobaFizyczna) {
        const osoba = properties.egb_EGB_OsobaFizyczna
        contentHTML += `<p><strong>Imię:</strong> ${osoba.pierwszeImie || 'Brak'}</p>`
      }

      for (const [key, value] of Object.entries(properties)) {
        if (key === 'geometria') {
          continue
        }
        if (value && typeof value === 'object') {
          contentHTML += `<p><strong>${key}:</strong> ${JSON.stringify(value)}</p>`
        } else {
          contentHTML += `<p><strong>${key}:</strong> ${value || 'Brak'}</p>`
        }
      }
      contentHTML += `</div>`

      popupContent.innerHTML = contentHTML
      overlay.setPosition(coordinate)
    }

    if (parsedGML && parsedGML.length > 0) {
      const chosenCRS = gmlParser.gml3Format.srsName
      const validFeatures = parsedGML.filter((f) => f && f.getGeometry())
      const transformedFeatures = mapUtils.transformFeaturesToWGS84(chosenCRS, validFeatures)

      const budynkiLayer = mapUtils.createVectorLayer(
        transformedFeatures.filter((f) => f.getKeys().includes('idBudynku')),
        0
      )
      const dzialkiLayer = mapUtils.createVectorLayer(
        transformedFeatures.filter((f) => f.getKeys().includes('idDzialki')),
        1
      )
      const uzytkiLayer = mapUtils.createVectorLayer(
        transformedFeatures.filter((f) => f.getKeys().includes('idUzytku')),
        2
      )
      const konturyLayer = mapUtils.createVectorLayer(
        transformedFeatures.filter((f) => f.getKeys().includes('idUzytku')),
        3
      )

      initializedMap.addLayer(budynkiLayer)
      initializedMap.addLayer(dzialkiLayer)
      initializedMap.addLayer(uzytkiLayer)
      initializedMap.addLayer(konturyLayer)

      setLayers({
        budynki: budynkiLayer,
        dzialki: dzialkiLayer,
        uzytki: uzytkiLayer,
        kontury: konturyLayer,
      })

      const vectorSource = new VectorSource({
        features: transformedFeatures,
      })

      if (vectorSource.getExtent()) {
        initializedMap.getView().fit(vectorSource.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 18,
        })
      }

      initializedMap.on('singleclick', (event) => {
        initializedMap.forEachFeatureAtPixel(event.pixel, (feature) => {
          const coordinate = event.coordinate
          displayPopup(feature, coordinate)
          return true
        })
      })
    }

    return () => {
      initializedMap.setTarget(null)
      initializedMap.dispose()
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
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div id="map" style={{ width: '100%', height: '100%' }}></div>
      <div className="layer-controls">
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => toggleLayerVisibility('budynki')}
          />
          Budynki
        </label>
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => toggleLayerVisibility('dzialki')}
          />
          Działki
        </label>
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => toggleLayerVisibility('uzytki')}
          />
          Użytki
        </label>
        <label>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => toggleLayerVisibility('kontury')}
          />
          Kontury
        </label>
      </div>
    </div>
  )
  
}

export default MapView
