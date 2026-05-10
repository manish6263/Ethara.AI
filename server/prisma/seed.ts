import bcrypt from "bcryptjs";
import { PrismaClient, ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ethara.ai" },
    update: {},
    create: { name: "Aarav Admin", email: "admin@ethara.ai", passwordHash }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@ethara.ai" },
    update: {},
    create: { name: "Meera Member", email: "member@ethara.ai", passwordHash }
  });

  const project = await prisma.project.create({
    data: {
      name: "AI Data Operations Launch",
      description: "Coordinate annotation, validation, QA, and delivery work for a client data pipeline.",
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: ProjectRole.ADMIN },
          { userId: member.id, role: ProjectRole.MEMBER }
        ]
      },
      tasks: {
        create: [
          {
            title: "Prepare onboarding dataset",
            description: "Upload the initial sample and confirm format guidelines with the operations team.",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            assignedToId: member.id,
            createdById: admin.id
          },
          {
            title: "Review quality rubric",
            description: "Check edge cases and acceptance thresholds before production labeling starts.",
            status: TaskStatus.REVIEW,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            assignedToId: admin.id,
            createdById: admin.id
          },
          {
            title: "Resolve overdue validation batch",
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            assignedToId: member.id,
            createdById: admin.id
          }
        ]
      }
    }
  });

  console.log(`Seeded ${project.name}`);
  console.log("Demo accounts: admin@ethara.ai / Password123, member@ethara.ai / Password123");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
