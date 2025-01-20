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

      const [budynkiLayer, dzialkiLayer, uzytkiLayer, konturyLayer] = mapUtils.getLayersFromFeatures(transformedFeatures)

      map.addLayer(budynkiLayer)
      map.addLayer(dzialkiLayer)
      map.addLayer(uzytkiLayer)
      map.addLayer(konturyLayer)

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
        map.getView().fit(vectorSource.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 18,
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
