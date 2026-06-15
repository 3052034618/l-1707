import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'pending';
  error?: string;
}

interface DocumentUploadZoneProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function DocumentUploadZone({
  onUpload,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  className,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return { valid: false, error: `文件大小超过限制 (最大 ${formatFileSize(maxSize)})` };
    }

    const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type.toLowerCase();

    const isAccepted = acceptedTypes.some(
      (type) => type === fileExtension || type === fileType || type === '*' || type === '/*' || fileType.startsWith(type.replace('/*', ''))
    );

    if (!isAccepted) {
      return { valid: false, error: '不支持的文件类型' };
    }

    return { valid: true };
  };

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      const validFiles: File[] = [];

      Array.from(fileList).forEach((file) => {
        const validation = validateFile(file);
        newFiles.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          progress: validation.valid ? 0 : 100,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error,
        });
        if (validation.valid) {
          validFiles.push(file);
        }
      });

      if (multiple) {
        setFiles((prev) => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles);
      }

      if (validFiles.length > 0) {
        simulateUpload(newFiles.filter((f) => f.status === 'pending'), validFiles);
      }
    },
    [accept, maxSize, multiple]
  );

  const simulateUpload = async (uploadedFiles: UploadedFile[], validFiles: File[]) => {
    uploadedFiles.forEach((uf, index) => {
      setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: 'uploading' as const } : f)));

      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === uf.id && f.progress < 100) {
              const newProgress = Math.min(f.progress + Math.random() * 20, 100);
              if (newProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                  setFiles((prev2) => prev2.map((f2) => (f2.id === uf.id ? { ...f2, status: 'success' as const, progress: 100 } : f2)));
                }, 200);
              }
              return { ...f, progress: newProgress };
            }
            return f;
          })
        );
      }, 200 + index * 100);
    });

    onUpload(validFiles);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRetryUpload = (uploadedFile: UploadedFile) => {
    const validation = validateFile(uploadedFile.file);
    if (validation.valid) {
      setFiles((prev) => prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'pending', progress: 0, error: undefined } : f)));
      simulateUpload([{ ...uploadedFile, status: 'pending' }], [uploadedFile.file]);
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300',
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300',
            isDragging ? 'bg-indigo-100' : 'bg-gray-100'
          )}
        >
          <Upload className={cn('h-7 w-7 transition-colors duration-300', isDragging ? 'text-indigo-600' : 'text-gray-500')} />
        </div>

        <div className="mt-4 text-center">
          <p className={cn('text-sm font-medium', isDragging ? 'text-indigo-600' : 'text-gray-700')}>
            {isDragging ? '释放以上传文件' : '点击或拖拽文件到此处'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            支持 {accept} 格式，单文件最大 {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-white p-3 transition-all duration-300',
                file.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              )}
            >
              <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

                {file.status === 'uploading' && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {file.status === 'error' && file.error && (
                  <p className="mt-1 text-xs text-red-600">{file.error}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {file.status === 'error' && (
                  <button
                    onClick={() => handleRetryUpload(file)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    title="重新上传"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  title="删除"
                >
                  {file.status === 'uploading' ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { DocumentUploadZoneProps, UploadedFile };
