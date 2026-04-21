interface AssignmentActionsProps {
  isAssigned: boolean
  volunteerName: string
  volunteerEmail: string
  onAssign: () => void
  onRemove: () => void
}

export function AssignmentActions({ 
  isAssigned, 
  volunteerName, 
  volunteerEmail, 
  onAssign, 
  onRemove 
}: AssignmentActionsProps) {
  if (isAssigned) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-sm border border-success/30 bg-green-50">
        <div>
          <p className="font-medium text-charcoal text-sm">{volunteerName}</p>
          <p className="text-xs text-gray-text">{volunteerEmail}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-sm font-medium text-white bg-error px-4 py-1.5 rounded-sm hover:bg-red-700 transition-colors shrink-0"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-sm border border-gray-border">
      <div>
        <p className="font-medium text-charcoal text-sm">{volunteerName}</p>
        <p className="text-xs text-gray-text">{volunteerEmail}</p>
      </div>
      <button
        onClick={onAssign}
        className="text-sm font-medium text-white bg-charcoal px-4 py-1.5 rounded-sm hover:bg-black transition-colors shrink-0"
      >
        Assign
      </button>
    </div>
  )
}
