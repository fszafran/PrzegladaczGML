import { useEffect } from 'react'
import '../assets/style.css'
import gmlParser from '../utils/gmlParser'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Fill, Stroke } from 'ol/style'
import mapUtils from '../utils/mapUtils'

const MapView = ({parsedGML}) => {
  useEffect(() => {
    const map = mapUtils.initializeMap()

    if (parsedGML && parsedGML.length > 0) {
      const chosenCRS = gmlParser.gml3Format.srsName
      const validFeatures = parsedGML.filter(f => f && f.getGeometry())
      const transformedFeatures = mapUtils.transformFeaturesToWGS84(chosenCRS, validFeatures)
      
      const vectorSource = new VectorSource({
        features: transformedFeatures
      })
      
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.1)'
          }),
          stroke: new Stroke({
            color: '#ff0000',
            width: 2
          })
        })
      })
      
      map.addLayer(vectorLayer)
      
      if (vectorSource.getExtent()) {
        map.getView().fit(vectorSource.getExtent(), {
          padding: [50, 50, 50, 50],
          maxZoom: 18
        })
      }
    }

    return () => {
      map.setTarget(null)
      map.dispose()
    }
  }, [parsedGML])
}

export default MapView