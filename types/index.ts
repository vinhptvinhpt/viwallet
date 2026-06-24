export type { User, Wallet, Category, Transaction, Budget, Trip, RecurringRule } from '@prisma/client'

export interface TransactionWithRelations {
  id: string
  amount: number
  currency: string
  exchangeRate: number | null
  convertedAmount: number
  type: string
  date: string
  note: string | null
  category: { id: string; name: string; icon: string; color: string }
  wallet: { id: string; name: string; currency: string; color: string }
  trip: { id: string; name: string } | null
}

export interface BudgetWithSpent {
  id: string
  name: string
  type: string
  amount: number
  currency: string
  alertThreshold: number
  category: { id: string; name: string; icon: string; color: string } | null
  spent: number
}
