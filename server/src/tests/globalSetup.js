import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup(project) {
  // Start our own process; never use an application or external test URI.
  const database = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  project.provide('mongoBaseUri', database.getUri());
  return async () => { await database.stop(); };
}
