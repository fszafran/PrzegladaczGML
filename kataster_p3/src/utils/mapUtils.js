import { useGeographic } from 'ol/proj'
import Map from 'ol/Map.js'
import OSM from 'ol/source/OSM.js'
import TileLayer from 'ol/layer/Tile.js'
import View from 'ol/View.js'

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

const transformFeaturesToWGS84 = (fromCRS, features) => {
    const wgsCRS = 'EPSG:4326'
    features.forEach(feature => {
        const geometry = feature.getGeometry();
        const coords = geometry.flatCoordinates;
        geometry.flatCoordinates = swapCoordinates(coords);
        geometry.transform(fromCRS, wgsCRS)
    });
    return features
}

export default { swapCoordinates, initializeMap, transformFeaturesToWGS84 }