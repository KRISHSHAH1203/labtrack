/** A biological or chemical sample moving through a lab study. */
export type SampleStatus = 'RECEIVED' | 'IN_ANALYSIS' | 'COMPLETED' | 'REJECTED';

export interface Sample {
  id: string;
  code: string;
  studyId: string;
  type: string;
  status: SampleStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Allowed status changes. Keeping the rules in one table means the API, GraphQL
 * and any future worker all enforce the same workflow.
 */
const TRANSITIONS: Record<SampleStatus, SampleStatus[]> = {
  RECEIVED: ['IN_ANALYSIS', 'REJECTED'],
  IN_ANALYSIS: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
};

export function canTransition(from: SampleStatus, to: SampleStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: SampleStatus, to: SampleStatus) {
    super(`Cannot move a sample from ${from} to ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
