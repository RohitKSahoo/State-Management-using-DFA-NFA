import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/seedData.js';

const prisma = new PrismaClient();

async function run() {
  await prisma.transition.deleteMany();
  await prisma.workflowState.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.project.deleteMany();
  await seedDatabase(prisma);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
