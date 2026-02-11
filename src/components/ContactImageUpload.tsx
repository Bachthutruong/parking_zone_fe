import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadContactImage, deleteContactImage } from '@/services/upload';

interface ContactImageUploadProps {
  onUploadSuccess?: (imageUrl: string) => void;
  onDeleteSuccess?: () => void;
  existingImageUrl?: string;
  maxFileSize?: number; // in MB
}

const ContactImageUpload: React.FC<ContactImageUploadProps> = ({
  onUploadSuccess,
  onDeleteSuccess,
  existingImageUrl,
  maxFileSize = 5
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} 不是有效的圖片檔案`);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`${file.name} 檔案大小超過 ${maxFileSize}MB`);
      return;
    }

    setSelectedFile(file);
    
    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('請選擇要上傳的圖片');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadContactImage(selectedFile);
      setUploadProgress(100);
      
      toast.success('圖片上傳成功');
      setSelectedFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(result.imageUrl);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || '上傳失敗');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async () => {
    if (!existingImageUrl) return;

    setDeleting(true);
    try {
      await deleteContactImage(existingImageUrl);
      toast.success('圖片刪除成功');
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || error.message || '刪除失敗');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Image */}
      {existingImageUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">當前圖片</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {existingImageUrl}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteImage}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting ? '刪除中...' : '刪除'}
              </Button>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open(existingImageUrl, '_blank')}
                className="w-full focus:outline-none"
              >
                <img
                  src={existingImageUrl}
                  alt="Current contact image"
                  className="w-full max-h-64 object-contain rounded-lg border bg-white cursor-zoom-in"
                />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇圖片
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                支援 JPG, PNG, GIF 格式，最大 {maxFileSize}MB
              </p>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeSelectedFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>上傳中...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Button */}
                {!uploading && (
                  <Button
                    onClick={handleUpload}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    上傳圖片
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactImageUpload;
