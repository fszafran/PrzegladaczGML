const FileInputForm = ({onFileChange, onSubmit}) => (
  <form onSubmit={onSubmit}>
    <div>
      <input type="file" accept=".gml" onChange={onFileChange}/>
    </div>
    <div>
      <button type="submit">Odczytaj</button>
    </div>
  </form>
)  

export default FileInputForm