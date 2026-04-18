import api from './api';

export interface DocumentData {
    id: string;
    title: string;
    category: string;
    file_url: string;
    file_type: string;
    description?: string;
    uploaded_by: string;
    created_at: string;
}

export const documentService = {
    async getDocuments(category?: string): Promise<DocumentData[]> {
        const response = await api.get('/admin/documents', {
            params: { category }
        });
        return response.data.documents;
    },

    async uploadDocument(formData: FormData): Promise<DocumentData> {
        const response = await api.post('/admin/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.document;
    },

    async deleteDocument(id: string): Promise<void> {
        await api.delete(`/admin/documents/${id}`);
    }
};
