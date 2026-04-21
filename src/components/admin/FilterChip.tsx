export interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  onClear?: () => void
}

export function FilterChip({ label, active, onClick, onClear }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
        active
          ? 'bg-teal-500 text-white border-teal-500'
          : 'border-gray-border text-gray-text hover:border-teal-500 hover:text-teal'
      }`}
    >
      {label}
      {active && onClear && (
        <span className="ml-2" onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}>
          ×
        </span>
      )}
    </button>
  )
}
