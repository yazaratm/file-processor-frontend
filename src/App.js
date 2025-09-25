import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ✅ Use your actual API URL
const API_BASE_URL = 'https://file-processor-api-b4aze4d6adg4gtd3.centralus-01.azurewebsites.net';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      // ✅ Correct: /files (no trailing slash needed for GET)
      const response = await axios.get(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus(''); // Clear status when new file selected
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadStatus('Uploading...');
    setLoading(true);

    try {
      // ✅ Correct: /upload/ (WITH trailing slash for POST)
      const response = await axios.post(`${API_BASE_URL}/upload/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });
      
      setUploadStatus(`✅ Upload Successful! File ID: ${response.data.id}`);
      setSelectedFile(null);
      // Reset file input
      document.getElementById('fileInput').value = '';
      // Refresh files list immediately
      setTimeout(fetchFiles, 1000);
      
    } catch (error) {
      console.error("Upload failed:", error);
      if (error.response) {
        setUploadStatus(`❌ Upload Failed: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        setUploadStatus('❌ Upload Failed: No response from server');
      } else {
        setUploadStatus(`❌ Upload Failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'error': return 'status-error';
      case 'uploaded': return 'status-uploaded';
      default: return 'status-default';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>File Upload & Processing Platform</h1>
        <p>Using Azure Table Storage</p>
        
        <div className="upload-section">
          <input 
            id="fileInput" 
            type="file" 
            onChange={handleFileChange}
            disabled={loading}
          />
          <button 
            onClick={handleUpload} 
            disabled={loading || !selectedFile}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
        
        <div className={`status ${loading ? 'status-loading' : ''}`}>
          {uploadStatus}
        </div>

        <div className="stats">
          <p>Total Files: {files.length} | 
            Completed: {files.filter(f => f.status === 'Completed').length} | 
            Processing: {files.filter(f => f.status === 'Processing').length}
          </p>
        </div>

        <h2>File Status</h2>
        <div className="files-table-container">
          {files.length === 0 ? (
            <p className="no-files">No files uploaded yet.</p>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Upload Time</th>
                  <th>Status</th>
                  <th>Size</th>
                  <th>File ID</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.RowKey || file.id}>
                    <td className="filename">{file.filename}</td>
                    <td className="upload-time">{formatDate(file.upload_time)}</td>
                    <td className={getStatusColor(file.status)}>
                      {file.status || 'Unknown'}
                    </td>
                    <td className="file-size">{formatFileSize(file.file_size)}</td>
                    <td className="file-id">{file.RowKey || file.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="api-info">
          <p>API Endpoint: {API_BASE_URL}</p>
          <p>Auto-refresh every 5 seconds</p>
        </div>
      </header>
    </div>
  );
}

export default App;
