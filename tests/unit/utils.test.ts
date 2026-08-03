import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional class names', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('correctly resolves Tailwind CSS conflicts', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});
