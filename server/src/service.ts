import { canTransition, ConflictError, InvalidTransitionError, NotFoundError, Sample, SampleStatus } from './domain/sample';
import { ListQuery, Page, SampleRepository } from './repository/SampleRepository';

/** Business rules live here; HTTP and GraphQL layers stay thin. */
export class SampleService {
  constructor(private readonly repo: SampleRepository) {}

  async register(input: { code: string; studyId: string; type: string }): Promise<Sample> {
    if (await this.repo.findByCode(input.code)) {
      throw new ConflictError(`Sample code ${input.code} already exists`);
    }
    return this.repo.create(input);
  }

  async get(id: string): Promise<Sample> {
    const sample = await this.repo.findById(id);
    if (!sample) throw new NotFoundError(`Sample ${id}`);
    return sample;
  }

  list(query: ListQuery): Promise<Page<Sample>> {
    return this.repo.list(query);
  }

  async advance(id: string, to: SampleStatus): Promise<Sample> {
    const sample = await this.get(id);
    if (!canTransition(sample.status, to)) throw new InvalidTransitionError(sample.status, to);
    return this.repo.updateStatus(id, to);
  }
}
