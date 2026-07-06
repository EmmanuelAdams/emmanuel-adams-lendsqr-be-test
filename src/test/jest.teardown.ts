import { db } from '../loaders/database.loader';

afterAll(async () => {
  await db.destroy();
});
