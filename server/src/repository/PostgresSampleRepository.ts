import { Pool } from 'pg';
import { Sample, SampleStatus, NotFoundError } from '../domain/sample';
import { ListQuery, Page, SampleRepository } from './SampleRepository';

/**
 * PostgreSQL implementation. Parameterised queries only (no string-built SQL),
 * and an index on (study_id, created_at) backs the main list query.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  study_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_samples_study_created ON samples (study_id, created_at DESC);
`;

type Row = { id: string; code: string; study_id: string; type: string; status: SampleStatus; created_at: Date; updated_at: Date };

const toSample = (r: Row): Sample => ({
  id: r.id, code: r.code, studyId: r.study_id, type: r.type, status: r.status,
  createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});

export class PostgresSampleRepository implements SampleRepository {
  constructor(private readonly pool: Pool) {}

  async migrate(): Promise<void> {
    await this.pool.query(SCHEMA);
  }

  async create(input: { code: string; studyId: string; type: string }): Promise<Sample> {
    const { rows } = await this.pool.query<Row>(
      `INSERT INTO samples (code, study_id, type, status) VALUES ($1, $2, $3, 'RECEIVED') RETURNING *`,
      [input.code, input.studyId, input.type],
    );
    return toSample(rows[0]);
  }

  async findById(id: string): Promise<Sample | undefined> {
    const { rows } = await this.pool.query<Row>(`SELECT * FROM samples WHERE id = $1`, [id]);
    return rows[0] ? toSample(rows[0]) : undefined;
  }

  async findByCode(code: string): Promise<Sample | undefined> {
    const { rows } = await this.pool.query<Row>(`SELECT * FROM samples WHERE code = $1`, [code]);
    return rows[0] ? toSample(rows[0]) : undefined;
  }

  async list({ studyId, status, limit, offset }: ListQuery): Promise<Page<Sample>> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (studyId) { params.push(studyId); where.push(`study_id = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = await this.pool.query<{ count: string }>(`SELECT count(*) FROM samples ${clause}`, params);
    params.push(limit, offset);
    const { rows } = await this.pool.query<Row>(
      `SELECT * FROM samples ${clause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items: rows.map(toSample), total: Number(total.rows[0].count) };
  }

  async updateStatus(id: string, status: SampleStatus): Promise<Sample> {
    const { rows } = await this.pool.query<Row>(
      `UPDATE samples SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status],
    );
    if (!rows[0]) throw new NotFoundError(`Sample ${id}`);
    return toSample(rows[0]);
  }
}
