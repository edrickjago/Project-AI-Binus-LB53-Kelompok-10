'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue =
        typeof value === 'function' ? (value as (val: T) => T)(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      } catch (err) {
        console.warn(`useLocalStorage: failed to write "${key}"`, err);
      }
      return nextValue;
    });
  };

  return [storedValue, setValue] as const;
}
