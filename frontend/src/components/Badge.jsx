import { VEHICLE_ICONS, VEHICLE_TYPES } from '../utils/constants'

export default function Badge({ tipo }) {
  return (
    <span className={`badge badge-${tipo}`}>
      {VEHICLE_ICONS[tipo]} {VEHICLE_TYPES[tipo]}
    </span>
  )
}

export { VEHICLE_ICONS as ICONS, VEHICLE_TYPES as LABELS }