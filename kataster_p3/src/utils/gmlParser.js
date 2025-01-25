import GML32 from 'ol/format/GML32.js'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import axios from 'axios'

const gml3Format = new GML32({
  featureNS: 'ewidencjaGruntowIBudynkow:1.0',
  featureType: ['EGB_DzialkaEwidencyjna', 
                'EGB_Budynek', 
                'EGB_KonturUzytkuGruntowego', 
                'EGB_KonturKlasyfikacyjny',
                'EGB_UdzialWeWlasnosci', 
                'EGB_OsobaFizyczna', 
                'EGB_Instytucja', 
                'EGB_Malzenstwo']
});

const getSRSFromDocument = (document) =>{
  let srsName = document.documentElement.getAttribute('srsName');
  if (!srsName) {
    const elementsWithSrsName = document.querySelectorAll('[srsName]');
    if (elementsWithSrsName.length > 0) {
      srsName = elementsWithSrsName[0].getAttribute('srsName');
    }
  }
  if (srsName) {
    const parts = srsName.split(':')
    return parts[parts.length -1]
  }
  return null
} 

const fetchDataFromEPSGIO = async (srsCode) => {
  const url = `https://epsg.io/${srsCode}.js`
  try {
    const response = await axios.get(url)
    return response.data

  } catch(error) {
    console.error('Error fetching data from EPSG.io:', error)
  }
}

const parseEPSGDefiniton = (definition) =>{
  let epsgCode = 'EPSG:2178'
  let params = '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  const re = /proj4\.defs\(["'](EPSG:\d+)["'],\s*["']([^"']+)["']\);/
  const match = definition.match(re)
  if(match){
    epsgCode = match[1]
    params = match[2]
  }
  proj4.defs(epsgCode, params)
  register(proj4)

  return epsgCode
}

const getValidEPSGCode = async (srsCode) => {
  try{
    const projDefinition = await fetchDataFromEPSGIO(srsCode)
    const validSrsIdentifier = parseEPSGDefiniton(projDefinition)
    return validSrsIdentifier
  }
  catch(error){
    console.error('Error while getting the projection from EPSGIO: ', error.message)
    return 'EPSG:2178'
  }
}

const parseGML = (GMLFile, setParsedGML) => {
    const reader = new FileReader()
    
    reader.onload = async (evt) => {
      const gmlString = evt.target.result
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(gmlString, 'application/xml')

      const srsCode = getSRSFromDocument(xmlDoc) || '2178'
      let epsgCode = await getValidEPSGCode(srsCode)
      
      gml3Format.srsName = epsgCode
      const features = gml3Format.readFeatures(xmlDoc, {
        dataProjection: epsgCode
      });
      setParsedGML(features)
    }
    reader.readAsText(GMLFile)
}

export default { gml3Format, parseGML }
