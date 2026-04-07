// Non-production sample DB client.
// Production runtime uses Netlify Functions with DATABASE_URL.
import { neon } from '@netlify/neon';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

export const db = drizzle({
    schema,
    client: neon()
});
