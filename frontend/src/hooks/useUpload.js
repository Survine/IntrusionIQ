import { useRef, useState } from 'react';
import { predictFile as predictFileAPI } from '../services/api';
import {
  isValidCSV,
  SAFE_ROW_THRESHOLD,
  UPLOAD_PROGRESS,
  UPLOAD_TIMING,
  VALID_CSV_EXTENSIONS,
} from '../constants';

function estimateCsvRowCount(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return Math.max(lines.length - 1, 0);
}

function formatUploadError(uploadError) {
  const fallback = 'Upload failed. Unable to analyze the file right now.';
  const message = uploadError?.message || fallback;

  if (message.includes('missing') && message.includes('required columns')) {
    return `Schema mismatch: ${message}`;
  }

  if (message.includes('Could not read CSV')) {
    return `Invalid CSV format: ${message}`;
  }

  if (uploadError?.status === 503) {
    return 'Backend is online but models are not ready yet. Try again after health turns green.';
  }

  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Backend appears offline. Start the API server and retry the upload.';
  }

  return message;
}

export function useUpload() {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState({
    visible: false,
    text: 'Preparing upload...',
    progress: 0,
  });
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rowWarning, setRowWarning] = useState('');
  const [validationNote, setValidationNote] = useState('');
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState('');

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  async function handleFile(file) {
    setError('');
    setRowWarning('');
    setValidationNote('');

    if (!isValidCSV(file.name)) {
      setError(`Please upload a valid CSV file. Supported: ${VALID_CSV_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please upload a CSV that contains header and flow rows.');
      return;
    }

    let estimatedRows = 0;
    try {
      const text = await file.text();
      estimatedRows = estimateCsvRowCount(text);

      if (estimatedRows <= 0) {
        setError('No flow rows were found in this CSV. Please provide at least one data row.');
        return;
      }

      if (estimatedRows > SAFE_ROW_THRESHOLD) {
        setRowWarning(
          `Large upload detected (${estimatedRows.toLocaleString()} rows). Processing may take longer than usual.`,
        );
      }

      setValidationNote(`Validated ${estimatedRows.toLocaleString()} rows before upload.`);
    } catch {
      setValidationNote('File selected. Row count estimate unavailable.');
    }

    setResults(null);
    setIsProcessing(true);
    setUploadState({ visible: true, text: `Uploading ${file.name}...`, progress: UPLOAD_PROGRESS.INITIAL });

    window.setTimeout(() => {
      setUploadState({
        visible: true,
        text: 'Analyzing flows via two-stage ensemble...',
        progress: UPLOAD_PROGRESS.ANALYZING,
      });
    }, UPLOAD_TIMING.INITIAL_DELAY);

    try {
      const data = await predictFileAPI(file);
      setUploadState({ visible: true, text: 'Analysis complete.', progress: UPLOAD_PROGRESS.COMPLETE });
      setResults(data);
      setLastAnalyzedAt(new Date().toISOString());

      window.setTimeout(() => {
        setUploadState({ visible: false, text: 'Preparing upload...', progress: 0 });
      }, UPLOAD_TIMING.COMPLETION_DELAY);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError(formatUploadError(uploadError));
      setUploadState({ visible: true, text: 'Upload failed.', progress: UPLOAD_PROGRESS.COMPLETE });

      window.setTimeout(() => {
        setUploadState({ visible: false, text: 'Preparing upload...', progress: 0 });
      }, UPLOAD_TIMING.ERROR_CLEAR_DELAY);
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    fileInputRef,
    isDragging,
    uploadState,
    error,
    results,
    isProcessing,
    rowWarning,
    validationNote,
    lastAnalyzedAt,
    handlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onBrowseClick: handleBrowseClick,
      onFileInput: handleFileInput,
    },
  };
}
