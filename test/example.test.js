/**
 * Example test to verify testing framework is working
 */

import { describe, test, expect } from 'vitest';

describe('Testing Framework', () => {
  test('should work correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    await expect(promise).resolves.toBe('test');
  });

  test('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toEqual({ name: 'test', value: 42 });
    expect(obj).toHaveProperty('name', 'test');
  });
});