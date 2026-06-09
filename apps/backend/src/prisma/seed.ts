import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Roles
  const roles = [
    { name: RoleName.admin, description: 'System Administrator with full access' },
    { name: RoleName.manager, description: 'Operations Manager for dispatching' },
    { name: RoleName.technician, description: 'Field Technician for repairs' },
    { name: RoleName.analyst, description: 'GIS and Data Analyst' },
    { name: RoleName.viewer, description: 'Read-only dashboard access' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions_json: { all: roleData.name === RoleName.admin },
      },
    });
    console.log(`Created role: ${roleData.name}`);
  }

  // 2. Create Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.admin } });
  
  if (adminRole) {
    const defaultPassword = 'AdminPassword123!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@roadwatch.local' },
      update: {},
      create: {
        email: 'admin@roadwatch.local',
        full_name: 'System Administrator',
        password_hash: passwordHash,
        role_id: adminRole.id,
        is_active: true,
      },
    });
    console.log(`Created admin user: ${admin.email}`);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });