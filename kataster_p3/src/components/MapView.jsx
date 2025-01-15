import { useEffect } from 'react'
import Map from 'ol/Map.js'
import OSM from 'ol/source/OSM.js'
import TileLayer from 'ol/layer/Tile.js'
import View from 'ol/View.js'
import '../assets/style.css'
import gmlParser from '../utils/gmlParser'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { useGeographic } from 'ol/proj'


const swapCoordinates = (coords) => {
  const result = [];
  for (let i = 0; i < coords.length; i += 3) {
    result.push(coords[i + 1]); // X
    result.push(coords[i]);     // Y
    result.push(coords[i + 2]); // Z
  }
  return result;
};

const MapView = ({parsedGML}) => {
  useEffect(() => {   
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

    if (parsedGML && parsedGML.length > 0) {
      const chosenSRS = gmlParser.gml3Format.srsName
      const wgsSRS = 'EPSG:4326'
      const features = [...parsedGML]
      const validFeatures = parsedGML.filter(f => f && f.getGeometry())
      validFeatures.forEach(feature => {
        const geometry = feature.getGeometry();
        const coords = geometry.flatCoordinates;
        geometry.flatCoordinates = swapCoordinates(coords);
        geometry.transform(chosenSRS, wgsSRS)
      });
      console.log(features[0].getGeometry());

  }}, [parsedGML])
}

export default MapView