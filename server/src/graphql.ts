import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { SampleService } from './service';
import { listQuerySchema, statusSchema } from './validation';

const schema = buildSchema(`
  enum SampleStatus { RECEIVED IN_ANALYSIS COMPLETED REJECTED }
  type Sample { id: ID! code: String! studyId: String! type: String! status: SampleStatus! createdAt: String! updatedAt: String! }
  type SamplePage { items: [Sample!]! total: Int! }
  type Query {
    sample(id: ID!): Sample
    samples(studyId: String, status: SampleStatus, limit: Int, offset: Int): SamplePage!
  }
  type Mutation {
    advanceSample(id: ID!, status: SampleStatus!): Sample!
  }
`);

/** GraphQL endpoint sharing the same service and rules as REST. */
export function graphqlHandler(service: SampleService) {
  const rootValue = {
    sample: ({ id }: { id: string }) => service.get(id),
    samples: (args: Record<string, unknown>) => service.list(listQuerySchema.parse(args)),
    advanceSample: ({ id, status }: { id: string; status: string }) =>
      service.advance(id, statusSchema.parse(status)),
  };
  return createHandler({ schema, rootValue });
}
