import { useRef, useState } from 'react';
import { predictFile as predictFileAPI } from '../services/api';
import { isValidCSV, VALID_CSV_EXTENSIONS } from '../constants';

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

    if (!isValidCSV(file.name)) {
      setError(`Please upload a valid CSV file. Supported: ${VALID_CSV_EXTENSIONS.join(', ')}`);
      return;
    }

    setResults(null);
    setUploadState({ visible: true, text: `Uploading ${file.name}...`, progress: 24 });

    window.setTimeout(() => {
      setUploadState({
        visible: true,
        text: 'Analyzing flows via two-stage ensemble...',
        progress: 62,
      });
    }, 220);

    try {
      const data = await predictFileAPI(file);
      setUploadState({ visible: true, text: 'Analysis complete.', progress: 100 });
      setResults(data);

      window.setTimeout(() => {
        setUploadState({ visible: false, text: 'Preparing upload...', progress: 0 });
      }, 550);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError(`Upload failed. ${uploadError.message}`);
      setUploadState({ visible: true, text: 'Upload failed.', progress: 100 });

      window.setTimeout(() => {
        setUploadState({ visible: false, text: 'Preparing upload...', progress: 0 });
      }, 2500);
    }
  }

  return {
    fileInputRef,
    isDragging,
    uploadState,
    error,
    results,
    handlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onBrowseClick: handleBrowseClick,
      onFileInput: handleFileInput,
    },
  };
}
