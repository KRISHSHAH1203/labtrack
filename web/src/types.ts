export type SampleStatus = 'RECEIVED' | 'IN_ANALYSIS' | 'COMPLETED' | 'REJECTED';

export interface Sample {
  id: string;
  code: string;
  studyId: string;
  type: string;
  status: SampleStatus;
  createdAt: string;
}

export const NEXT_STATUS: Record<SampleStatus, SampleStatus | null> = {
  RECEIVED: 'IN_ANALYSIS',
  IN_ANALYSIS: 'COMPLETED',
  COMPLETED: null,
  REJECTED: null,
};
