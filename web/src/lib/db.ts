import postgres from 'postgres';

const globalForDb = global as unknown as { conn: ReturnType<typeof postgres> | undefined };

const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;

export default conn;
