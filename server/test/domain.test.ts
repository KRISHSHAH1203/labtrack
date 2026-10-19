import { canTransition } from '../src/domain/sample';

describe('sample workflow rules', () => {
  it.each([
    ['RECEIVED', 'IN_ANALYSIS', true],
    ['RECEIVED', 'COMPLETED', false],
    ['IN_ANALYSIS', 'COMPLETED', true],
    ['COMPLETED', 'RECEIVED', false],
    ['REJECTED', 'IN_ANALYSIS', false],
  ] as const)('%s -> %s is %s', (from, to, ok) => {
    expect(canTransition(from, to)).toBe(ok);
  });
});
