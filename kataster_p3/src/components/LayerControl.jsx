const LayerControl = ({onChange}) => {
    return (
        <div id='layerControl' className='layer-controls'>
            <label>
            <input
                type="checkbox"
                defaultChecked
                onChange={() => onChange('budynki')}
            />
            Budynki
            </label>
            <label>
            <input
                type="checkbox"
                defaultChecked
                onChange={() => onChange('dzialki')}
            />
            Działki
            </label>
            <label>
            <input
                type="checkbox"
                defaultChecked
                onChange={() => onChange('uzytki')}
            />
            Użytki
            </label>
            <label>
            <input
                type="checkbox"
                defaultChecked
                onChange={() => onChange('kontury')}
            />
            Kontury
            </label>
        </div>
    )
}
export default LayerControl