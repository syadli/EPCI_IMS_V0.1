import { PrismaClient, UserRole, IRPriority, IRStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Companies
  const c1 = await prisma.company.upsert({
    where: { code: 'KON1' },
    update: {},
    create: { name: 'Contractor Alpha (KON1)', code: 'KON1', type: 'contractor' },
  });

  const c2 = await prisma.company.upsert({
    where: { code: 'KON2' },
    update: {},
    create: { name: 'Contractor Beta (KON2)', code: 'KON2', type: 'contractor' },
  });

  const c3 = await prisma.company.upsert({
    where: { code: 'KON3' },
    update: {},
    create: { name: 'Contractor Gamma (KON3)', code: 'KON3', type: 'contractor' },
  });

  const client = await prisma.company.upsert({
    where: { code: 'OWN' },
    update: {},
    create: { name: 'Energy Global Corp (Client)', code: 'OWN', type: 'client' },
  });

  // 2. Projects
  const p1 = await prisma.project.upsert({
    where: { code: 'PRJ-001' },
    update: {},
    create: {
      name: 'Offshore Platform Construction',
      code: 'PRJ-001',
      companies: { connect: [{ id: c1.id }, { id: c2.id }, { id: client.id }] },
    },
  });

  const p2 = await prisma.project.upsert({
    where: { code: 'PRJ-002' },
    update: {},
    create: {
      name: 'Pipeline Installation Phase 2',
      code: 'PRJ-002',
      companies: { connect: [{ id: c2.id }, { id: c3.id }, { id: client.id }] },
    },
  });

  // 3. Users
  // Super User
  await prisma.user.upsert({
    where: { email: 'superuser@epci-ims.com' },
    update: {},
    create: {
      name: 'Ahmad Rizky',
      email: 'superuser@epci-ims.com',
      role: UserRole.super_user,
      companyId: client.id,
      isActive: true,
      avatarInitials: 'AR',
      projects: { connect: [{ id: p1.id }, { id: p2.id }] },
    },
  });

  // Project Admin
  await prisma.user.upsert({
    where: { email: 'padmin@epci-ims.com' },
    update: {},
    create: {
      name: 'Gilang Ramadhan',
      email: 'padmin@epci-ims.com',
      role: UserRole.project_admin,
      companyId: client.id,
      isActive: true,
      avatarInitials: 'GR',
      projects: { connect: [{ id: p1.id }] },
    },
  });

  // Contractor Managers
  await prisma.user.upsert({
    where: { email: 'manager.kon1@epci-ims.com' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'manager.kon1@epci-ims.com',
      role: UserRole.manager,
      companyId: c1.id,
      isActive: true,
      avatarInitials: 'BS',
      projects: { connect: [{ id: p1.id }] },
    },
  });

  // Client Representative
  await prisma.user.upsert({
    where: { email: 'client@epci-ims.com' },
    update: {},
    create: {
      name: 'Diana Putri',
      email: 'client@epci-ims.com',
      role: UserRole.client,
      companyId: client.id,
      isActive: true,
      avatarInitials: 'DP',
      projects: { connect: [{ id: p1.id }, { id: p2.id }] },
    },
  });

  // Contractor Beta Manager (KON2)
  await prisma.user.upsert({
    where: { email: 'manager.kon2@epci-ims.com' },
    update: {},
    create: {
      name: 'Rudi Hermawan',
      email: 'manager.kon2@epci-ims.com',
      role: UserRole.manager,
      companyId: c2.id,
      isActive: true,
      avatarInitials: 'RH',
      projects: { connect: [{ id: p1.id }, { id: p2.id }] },
    },
  });

  // Contractor Gamma Manager (KON3)
  await prisma.user.upsert({
    where: { email: 'manager.kon3@epci-ims.com' },
    update: {},
    create: {
      name: 'Siti Aminah',
      email: 'manager.kon3@epci-ims.com',
      role: UserRole.manager,
      companyId: c3.id,
      isActive: true,
      avatarInitials: 'SA',
      projects: { connect: [{ id: p2.id }] },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
