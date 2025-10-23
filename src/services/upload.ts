import api from './api';

export interface UploadResponse {
  success: boolean;
  message: string;
  imageUrl: string;
  imageData: {
    url: string;
    thumbnailUrl: string;
    cloudinaryId: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// Upload contact image
export const uploadContactImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('images', file);
  
  const response = await api.post('/upload/contact-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Delete contact image
export const deleteContactImage = async (imageUrl: string): Promise<DeleteResponse> => {
  const response = await api.delete('/upload/contact-image', {
    data: { imageUrl }
  });
  
  return response.data;
};
