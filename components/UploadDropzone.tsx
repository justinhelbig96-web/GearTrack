'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Upload, ImageIcon } from 'lucide-react'

interface UploadDropzoneProps {
  onFile: (file: File) => void
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  previewUrl?: string
}

export function UploadDropzone({
  onFile,
  className,
  children,
  disabled,
  previewUrl,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) onFile(file)
      setIsDragOver(false)
    },
    [onFile]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative cursor-pointer rounded border border-dashed transition-all duration-200',
        isDragOver
          ? 'border-d4-gold bg-d4-gold/10 shadow-slot-hover'
          : 'border-d4-border bg-slot-empty hover:border-d4-gold/60 hover:shadow-slot',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      {children ?? (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-d4-muted">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Item preview"
              className="max-h-32 max-w-full object-contain rounded"
            />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-xs text-center">Drop screenshot here</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
