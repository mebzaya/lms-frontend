import { ArrowDownIcon, ArrowUpIcon } from './icons'

export default function SortableHeader({ label, sortKey, activeKey, direction, onSort }) {
  const isActive = activeKey === sortKey

  return (
    <th aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sortable-header" onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-indicator">
          {isActive ? direction === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon /> : null}
        </span>
      </button>
    </th>
  )
}
