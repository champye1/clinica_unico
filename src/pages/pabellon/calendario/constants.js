export const MESES = [
  { indice: 0, nombre: 'ENERO' },
  { indice: 1, nombre: 'FEBRERO' },
  { indice: 2, nombre: 'MARZO' },
  { indice: 3, nombre: 'ABRIL' },
  { indice: 4, nombre: 'MAYO' },
  { indice: 5, nombre: 'JUNIO' },
  { indice: 6, nombre: 'JULIO' },
  { indice: 7, nombre: 'AGOSTO' },
  { indice: 8, nombre: 'SEPTIEMBRE' },
  { indice: 9, nombre: 'OCTUBRE' },
  { indice: 10, nombre: 'NOVIEMBRE' },
  { indice: 11, nombre: 'DICIEMBRE' },
]

export const DOCTOR_COLORS = [
  { bg: '#f5f3ff', border: '#7c3aed', dot: '#7c3aed', text: '#5b21b6', label: 'purple' },
  { bg: '#ecfeff', border: '#0891b2', dot: '#0891b2', text: '#0e7490', label: 'cyan' },
  { bg: '#fff7ed', border: '#ea580c', dot: '#ea580c', text: '#c2410c', label: 'orange' },
  { bg: '#fdf2f8', border: '#db2777', dot: '#db2777', text: '#be185d', label: 'pink' },
  { bg: '#f0fdfa', border: '#0d9488', dot: '#0d9488', text: '#0f766e', label: 'teal' },
  { bg: '#eef2ff', border: '#4f46e5', dot: '#4f46e5', text: '#4338ca', label: 'indigo' },
  { bg: '#fefce8', border: '#ca8a04', dot: '#ca8a04', text: '#a16207', label: 'yellow' },
  { bg: '#fef2f2', border: '#b91c1c', dot: '#b91c1c', text: '#991b1b', label: 'red' },
]

export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`)
