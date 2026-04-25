export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const VALID_CSV_EXTENSIONS = ['.csv'];

export const NAV_ITEMS = [
  ['How it works', '#workflow'],
  ['Analyze', '#analysis'],
  ['Results', '#results'],
  ['Health', '#health'],
];

export const UPLOAD_TIMING = {
  INITIAL_DELAY: 220,
  COMPLETION_DELAY: 550,
  ERROR_CLEAR_DELAY: 2500,
};

export const UPLOAD_PROGRESS = {
  INITIAL: 24,
  ANALYZING: 62,
  COMPLETE: 100,
};

export const SAFE_ROW_THRESHOLD = 50000;

export function isValidCSV(fileName) {
  return VALID_CSV_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
}
