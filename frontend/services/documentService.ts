import apiClient from './apiClient';
import { IDocument } from '@/types';

type UploadPayload = {
  file: File;
  name?: string;
  description?: string;
  tags?: string[];
  accessRoles?: string[];
};

export const documentService = {
  list: async () => {
    const { data } = await apiClient.get<IDocument[]>('/documents');
    return data;
  },
  upload: async (payload: UploadPayload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.name) formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    if (payload.tags?.length) formData.append('tags', payload.tags.join(','));
    if (payload.accessRoles?.length) formData.append('accessRoles', payload.accessRoles.join(','));
    const { data } = await apiClient.post<IDocument>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};
