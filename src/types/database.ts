export interface Expense {
    id: string
    user_id: string
    amount: number
    description: string
    category: string
    date: string
    created_at: string
  }
  
  export type ExpenseCategory = 
    | 'Food & Dining'
    | 'Transportation'
    | 'Shopping'
    | 'Entertainment'
    | 'Bills & Utilities'
    | 'Healthcare'
    | 'Education'
    | 'Travel'
    | 'Business'
    | 'Other'
  
  export interface ExpenseFormData {
    amount: number
    description: string
    category: ExpenseCategory
    date: string
  }
  
  export interface User {
    id: string
    email: string
  }