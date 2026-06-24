// Prisma client singleton — schema is defined in Task 2.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

// PrismaClient is imported lazily so this file compiles before `prisma generate` has run.
// Once the schema is in place (Task 2), replace `any` with the real PrismaClient type.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
