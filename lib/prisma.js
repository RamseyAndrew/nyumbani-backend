const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prisma;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Local Development: Re-use the pool connection instance across hot-reloads
  if (!global.cachedPrisma) {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // 👇 ADD THIS BLOCK TO AUTHORIZE EXTERNAL TRAFFIC ON RENDER
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 15000
    });
    const adapter = new PrismaPg(pool);
    global.cachedPrisma = new PrismaClient({ adapter });
  }
  prisma = global.cachedPrisma;
}

module.exports = prisma;