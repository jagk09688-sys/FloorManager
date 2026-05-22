'use strict';

/**
 * Run once to create the first admin account:
 *   node scripts/seedAdmin.js
 *
 * Change ADMIN_EMAIL / ADMIN_PASSWORD before running, or pass as env vars:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret node scripts/seedAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@flooringjunction.com.au';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Administrator';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: { password: hash, role: 'admin', fullName: ADMIN_NAME },
    create: { email: ADMIN_EMAIL, password: hash, role: 'admin', fullName: ADMIN_NAME },
  });

  console.log(`\n✓ Admin user ready`);
  console.log(`  ID:       ${user.id}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}  ← change this after first login!\n`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
