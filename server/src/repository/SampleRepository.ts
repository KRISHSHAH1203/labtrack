import { Sample, SampleStatus } from '../domain/sample';

export interface ListQuery {
  studyId?: string;
  status?: SampleStatus;
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

/**
 * Storage port. The service depends on this interface, not on Postgres, so tests
 * run against the in-memory version (dependency inversion).
 */
export interface SampleRepository {
  create(input: { code: string; studyId: string; type: string }): Promise<Sample>;
  findById(id: string): Promise<Sample | undefined>;
  findByCode(code: string): Promise<Sample | undefined>;
  list(query: ListQuery): Promise<Page<Sample>>;
  updateStatus(id: string, status: SampleStatus): Promise<Sample>;
}
