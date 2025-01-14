import GML32 from 'ol/format/GML32.js'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

const gml3Format = new GML32({
    featureNS: 'ewidencjaGruntowIBudynkow:1.0',
    featureType: ['EGB_DzialkaEwidencyjna', 'EGB_Budynek', 'EGB_KonturUzytkuGruntowego', 'EGB_KonturKlasyfikacyjny'],
    srsName: 'EPSG:2178'
  });

const parseGML = (GMLFile, setParsedGML) => {
    const reader = new FileReader()
    proj4.defs('EPSG:2178', '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs')
    register(proj4)

    reader.onload = (evt) => {
      const gmlString = evt.target.result

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(gmlString, 'application/xml')
      
      const features = gml3Format.readFeatures(xmlDoc, {
        dataProjection: 'EPSG:2178'
      });
      setParsedGML(features)
    }
    reader.readAsText(GMLFile)
}

export default { gml3Format, parseGML }
