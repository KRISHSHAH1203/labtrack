import { randomUUID } from 'node:crypto';
import { Sample, SampleStatus, NotFoundError } from '../domain/sample';
import { ListQuery, Page, SampleRepository } from './SampleRepository';

export class InMemorySampleRepository implements SampleRepository {
  private readonly samples = new Map<string, Sample>();

  async create(input: { code: string; studyId: string; type: string }): Promise<Sample> {
    const now = new Date().toISOString();
    const sample: Sample = { id: randomUUID(), ...input, status: 'RECEIVED', createdAt: now, updatedAt: now };
    this.samples.set(sample.id, sample);
    return sample;
  }

  async findById(id: string): Promise<Sample | undefined> {
    return this.samples.get(id);
  }

  async findByCode(code: string): Promise<Sample | undefined> {
    return [...this.samples.values()].find((s) => s.code === code);
  }

  async list({ studyId, status, limit, offset }: ListQuery): Promise<Page<Sample>> {
    const filtered = [...this.samples.values()]
      .filter((s) => (studyId ? s.studyId === studyId : true))
      .filter((s) => (status ? s.status === status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: filtered.slice(offset, offset + limit), total: filtered.length };
  }

  async updateStatus(id: string, status: SampleStatus): Promise<Sample> {
    const existing = this.samples.get(id);
    if (!existing) throw new NotFoundError(`Sample ${id}`);
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.samples.set(id, updated);
    return updated;
  }
}
