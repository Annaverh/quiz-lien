import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from './storage';

/** In-memory stand-in: Node's own experimental localStorage global is unusable without a file. */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & { size(): number } {
  const items = new Map<string, string>();
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: key => void items.delete(key),
    size: () => items.size,
  };
}

describe('storage.migrate', () => {
  let local: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    local = memoryStorage();
    vi.stubGlobal('localStorage', local);
    return () => vi.unstubAllGlobals();
  });

  it('moves a value to the new key', () => {
    local.setItem('old', '{"rounds":3}');
    storage.migrate('old', 'new');
    expect(storage.read('new', null)).toEqual({ rounds: 3 });
    expect(local.getItem('old')).toBeNull();
  });

  it('keeps an existing value under the new key and drops the old one', () => {
    local.setItem('old', '1');
    local.setItem('new', '2');
    storage.migrate('old', 'new');
    expect(local.getItem('new')).toBe('2');
    expect(local.getItem('old')).toBeNull();
  });

  it('does nothing when there is no old value', () => {
    storage.migrate('old', 'new');
    expect(local.size()).toBe(0);
  });
});
