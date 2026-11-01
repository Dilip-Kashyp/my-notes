import { useSyncExternalStore } from 'react';

// index.html sets data-theme before first paint; this keeps React in sync with it.
const STORAGE_KEY = 'engineering-notebook:theme';
const listeners = new Set();

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light');
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Theme still switches for this visit
  }
  listeners.forEach((listener) => listener());
}
