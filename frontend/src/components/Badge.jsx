const ICONS = {
  moto:   '🏍',
  carro:  '🚗',
  furgon: '🚐',
  camion: '🚚',
  bus:    '🚌',
}

const LABELS = {
  moto:   'Moto',
  carro:  'Carro',
  furgon: 'Furgón',
  camion: 'Camión',
  bus:    'Bus',
}

export default function Badge({ tipo }) {
  return (
    <span className={`badge badge-${tipo}`}>
      {ICONS[tipo]} {LABELS[tipo]}
    </span>
  )
}

export { ICONS, LABELS }