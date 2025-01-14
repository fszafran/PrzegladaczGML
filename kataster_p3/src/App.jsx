import { useState } from 'react'
import FileInputForm from './components/FileInputForm'
import MapView from './components/MapView'
import gmlParser from './utils/gmlParser'

const App = () => {
  const [file, setFile] = useState(null)
  const [parsedGML, setParsedGML] = useState(null)

  const handleFileChange = (event) => setFile(event.target.files[0])

  const onUpload = (event) => {
    event.preventDefault()
    if(file){
      gmlParser.parseGML(file, setParsedGML)
    }
  }

  return (
    <div>
      <FileInputForm onFileChange={handleFileChange} onSubmit={onUpload}/>
      <MapView parsedGML={parsedGML}/>
    </div>
  )
}

export default App
