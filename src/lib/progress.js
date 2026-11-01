import { useSyncExternalStore } from 'react';

// Reading progress lives in localStorage: which chapters are done, and the last one opened.
const STORAGE_KEY = 'engineering-notebook:progress';
const EMPTY = { done: {}, last: null };
const listeners = new Set();

function read() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return EMPTY;
  }
}

let state = read();

function write(next) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage full: progress just won't persist
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      state = read();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useProgress() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function toggleDone(path) {
  const done = { ...state.done };
  if (done[path]) {
    delete done[path];
  } else {
    done[path] = true;
  }
  write({ ...state, done });
}

export function markVisited(path) {
  if (state.last !== path) {
    write({ ...state, last: path });
  }
}
