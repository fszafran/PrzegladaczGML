import { useGeographic } from 'ol/proj'
import Map from 'ol/Map.js'
import OSM from 'ol/source/OSM.js'
import TileLayer from 'ol/layer/Tile.js'
import View from 'ol/View.js'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Fill, Stroke } from 'ol/style'

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

const colors = [
  {fill: 'rgba(255, 0, 0, 0.5)', stroke: '#ff0000'},    // Red
  {fill: 'rgba(0, 128, 0, 0.6)', stroke: '#008000'},    // Green
  {fill: 'rgba(0, 0, 255, 0.7)', stroke: '#0000ff'},    // Blue
  {fill: 'rgba(255, 165, 0, 0.1)', stroke: '#ffa500'}   // Orange
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
  return [budynkiLayer, dzialkiLayer, uzytkiLayer, konturyLayer]
}

export default { swapCoordinates, initializeMap, transformFeaturesToWGS84, getLayersFromFeatures }