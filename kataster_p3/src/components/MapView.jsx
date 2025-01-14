import GML32 from 'ol/format/GML32.js'
import { useEffect } from 'react'
import Map from 'ol/Map.js'
import OSM from 'ol/source/OSM.js'
import TileLayer from 'ol/layer/Tile.js'
import View from 'ol/View.js'
import '../assets/style.css'
import gmlParser from '../utils/gmlParser'
import Vector from 'ol/layer/Vector'
import { useGeographic } from 'ol/proj'

const MapView = ({parsedGML}) => {
  useEffect (()=>{   
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
  }, [])
}

export default MapView