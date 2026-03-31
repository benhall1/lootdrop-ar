import fs from 'fs';
import pg from 'pg';
const file = process.argv[2];
if (!file) { console.error('Usage: node run_migration.mjs <file.sql>'); process.exit(1); }
const sql = fs.readFileSync(file, 'utf8');
const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.arleuppwmnzhlebvkhmz',
  password: '8*sGdP2&vYNQT9*',
  ssl: { rejectUnauthorized: false },
});
try {
  await client.connect();
  await client.query(sql);
  console.log('Done!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await client.end();
}
