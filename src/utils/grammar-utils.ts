export const POS_COLORS: Record<string, string> = {
  N: '#2F7C76', PN: '#337A8B', ADJ: '#9C6F35',
  V: '#9E3C51', PERF: '#8C3246', IMPF: '#9E3C51', IMPV: '#7A2C3E',
  P: '#4A6BC2', DET: '#5A82CB', CONJ: '#605DB5', SUB: '#6E6EBF',
  PRON: '#7A6ABF', REL: '#7A6ABF', DEM: '#6E6EBF',
  NEG: '#805DAB', PRO: '#8B6DB5', INTG: '#9E5071', VOC: '#A86642',
  LOC: '#587A2C', T: '#4C6524', ACC: '#6D57A1', AMD: '#8A523A',
  ANS: '#8A603A', AVR: '#9C6F35', CIRC: '#337A8B', COM: '#337A8B',
  COND: '#4D5663', EQ: '#4D5663', SUR: '#A88036', INC: '#A88036'
};

export function getPoSColor(pos?: string) {
  const defaultColor = '#64748B';
  if (!pos) return defaultColor;
  return POS_COLORS[pos] || defaultColor;
}

export const MOOD_LABELS: Record<string, string> = {
  IND: 'Indicative',
  SUBJ: 'Subjunctive',
  JUS: 'Jussive',
};

export const CASE_LABELS: Record<string, { label: string; arabic: string }> = {
  NOM: { label: 'Nominative', arabic: 'Marfū‘' },
  ACC: { label: 'Accusative', arabic: 'Manṣūb' },
  GEN: { label: 'Genitive', arabic: 'Majrūr' },
};
