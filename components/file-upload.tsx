import React, { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { validateCSVFile } from '@/lib/csv-parser'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isProcessing?: boolean
}

export function FileUpload({ onFileSelect, isProcessing = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    try {
      validateCSVFile(file)
      setError(null)
      onFileSelect(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid file format')
    }
  }

  const clearError = () => setError(null)

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload CSV File</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV file here, or click to browse
            </p>
          </div>
          <Button type="button" variant="outline" disabled={isProcessing}>
            <FileText className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <X className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-auto p-1 ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Expected CSV format:</p>
        <code className="block p-2 bg-muted rounded text-left">
          Symbol,amount share,Price USD,Status,Total Pay USD,Total Fee USD,Date
        </code>
      </div>
    </div>
  )
}
