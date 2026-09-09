import LibraryGrid from '../components/LibraryGrid.jsx'

export default function Library({ lowEnd, onStepInside }) {
  return (
    <div className="content">
      <h1>&#9654; LIBRARY - ROWS OF CABINETS</h1>
      <LibraryGrid lowEnd={lowEnd} onStepInside={onStepInside} />
    </div>
  )
}
