import api from './api';

export interface ExpenseData {
    id?: string;
    title: string;
    description: string;
    amount: string | number;
    category: string;
    expense_date: string;
    payee: string | null;
    attachment_url?: string;
    status?: 'completed' | 'pending';
}

export const expenseService = {
    async getExpenses(): Promise<ExpenseData[]> {
        const response = await api.get('/admin/expenses');
        return response.data.expenses;
    },

    async createExpense(formData: FormData): Promise<ExpenseData> {
        const response = await api.post('/admin/expenses', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.expense;
    },

    async deleteExpense(id: string): Promise<void> {
        await api.delete(`/admin/expenses/${id}`);
    },

    async getMonthlyTotal(): Promise<number> {
        // The backend stats endpoint returns aggregated data
        const response = await api.get('/admin/expenses/stats');
        return response.data.stats.monthly[0]?.total_amount || 0;
    },

    async getStats(): Promise<any> {
        const response = await api.get('/admin/expenses/stats');
        return response.data.stats;
    }
};
