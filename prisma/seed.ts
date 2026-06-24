import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

const SYSTEM_CATEGORIES = [
  // Expense
  { name: 'Food & Dining', icon: 'utensils', color: '#F59E0B', type: CategoryType.EXPENSE },
  { name: 'Transportation', icon: 'car', color: '#3B82F6', type: CategoryType.EXPENSE },
  { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', type: CategoryType.EXPENSE },
  { name: 'Entertainment', icon: 'tv', color: '#8B5CF6', type: CategoryType.EXPENSE },
  { name: 'Health', icon: 'heart-pulse', color: '#EF4444', type: CategoryType.EXPENSE },
  { name: 'Housing', icon: 'home', color: '#14B8A6', type: CategoryType.EXPENSE },
  { name: 'Travel', icon: 'plane', color: '#06B6D4', type: CategoryType.EXPENSE },
  { name: 'Education', icon: 'book-open', color: '#10B981', type: CategoryType.EXPENSE },
  { name: 'Bills & Utilities', icon: 'zap', color: '#F97316', type: CategoryType.EXPENSE },
  { name: 'Personal Care', icon: 'sparkles', color: '#A855F7', type: CategoryType.EXPENSE },
  { name: 'Other Expense', icon: 'circle-dot', color: '#64748B', type: CategoryType.EXPENSE },
  // Income
  { name: 'Salary', icon: 'briefcase', color: '#22C55E', type: CategoryType.INCOME },
  { name: 'Freelance', icon: 'laptop', color: '#34D399', type: CategoryType.INCOME },
  { name: 'Investment', icon: 'trending-up', color: '#6EE7B7', type: CategoryType.INCOME },
  { name: 'Gift', icon: 'gift', color: '#FCD34D', type: CategoryType.INCOME },
  { name: 'Other Income', icon: 'circle-dot', color: '#64748B', type: CategoryType.INCOME },
]

async function main() {
  for (const cat of SYSTEM_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: { id: cat.name, userId: null, ...cat },
    })
  }
  console.log('Seeded system categories')
}

main().finally(() => prisma.$disconnect())
