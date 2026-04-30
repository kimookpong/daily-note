import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "kimookpong@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      email: "kimookpong@gmail.com",
      name: "Super Admin",
      role: "ADMIN",
    },
  })

  console.log("✓ Admin user ready:", admin.email, `(${admin.role})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
