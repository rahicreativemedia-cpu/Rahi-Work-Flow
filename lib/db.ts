import fs from 'fs';
import path from 'path';
import { AppState } from './types';
import { initialData } from '../data/seedData';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database file exists
export function getDB(): AppState {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppState;
    parsed.invoices = parsed.invoices || [];
    parsed.payments = parsed.payments || [];
    parsed.expenses = parsed.expenses || [];
    parsed.sessions = parsed.sessions || [];
    parsed.passwordResets = parsed.passwordResets || [];
    (parsed as any).rateLimits = Array.isArray((parsed as any).rateLimits) ? (parsed as any).rateLimits : [];
    return parsed;
  } catch (error) {
    console.error('Failed to read database, falling back to seed:', error);
    return initialData;
  }
}

export function saveDB(state: AppState): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('Failed to persist database:', error);
    throw error;
  }
}

export function resetDB(): AppState {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}
