import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Upload, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  parkingTypeId: string;
  onUploadSuccess?: (images: any[]) => void;
  onDeleteSuccess?: () => void;
  existingImages?: Array<{
    _id: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    isActive: boolean;
  }>;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  parkingTypeId,
  onUploadSuccess,
  onDeleteSuccess,
  existingImages = [],
  maxFiles = 10,
  maxFileSize = 10
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是有效的圖片文件`);
        return false;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`${file.name} 文件大小超過 ${maxFileSize}MB`);
        return false;
      }
      return true;
    });

    // Check total file count
    if (existingImages.length + selectedFiles.length + validFiles.length > maxFiles) {
      toast.error(`最多只能上傳 ${maxFiles} 張圖片`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
  };

  // Cleanup object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file && typeof file === 'object' && 'name' in file) {
          // Object URLs are automatically cleaned up by the browser
          // but we can be explicit about it
        }
      });
    };
  }, [selectedFiles]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('請選擇要上傳的圖片');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://parking-zone-be.onrender.com'}/api/parking/${parkingTypeId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '上傳失敗');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      toast.success(`成功上傳 ${result.images.length} 張圖片`);
      setSelectedFiles([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(result.images);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : '上傳失敗');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openDeleteDialog = (imageId: string) => {
    setImageToDelete(imageId);
    setShowDeleteDialog(true);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeleting(imageToDelete);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://parking-zone-be.onrender.com'}/api/parking/${parkingTypeId}/images/${imageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '刪除失敗');
      }

      toast.success('圖片刪除成功');
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : '刪除失敗');
    } finally {
      setDeleting(null);
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">上傳圖片</h3>
              <span className="text-sm text-gray-500">
                {existingImages.length + selectedFiles.length} / {maxFiles} 張
              </span>
            </div>

            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || existingImages.length + selectedFiles.length >= maxFiles}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                選擇圖片
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                支持 JPG, PNG, GIF 格式，單個文件最大 {maxFileSize}MB
              </p>
            </div>

            {/* Selected Files with Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">待上傳的圖片:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSelectedFile(index)}
                          disabled={uploading}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>上傳中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? '上傳中...' : `上傳 ${selectedFiles.length} 張圖片`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">已上傳的圖片</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map((image) => (
                <div key={image._id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/logo.png';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(image._id)}
                      disabled={deleting === image._id}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      {deleting === image._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {image.originalName}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除圖片</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除這張圖片嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setImageToDelete(null);
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting !== null}
            >
              {deleting ? '刪除中...' : '刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageUpload;
