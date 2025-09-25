import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ✅ Use your actual API URL (no trailing slash)
const API_BASE_URL = 'https://file-processor-api-b4aze4d6adg4gtd3.centralus-01.azurewebsites.net';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      // ✅ Correct: /files (no trailing slash)
      const response = await axios.get(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadStatus('Uploading...');

    try {
      // ✅ Correct: /upload (no trailing slash)
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus(`Upload Successful! File ID: ${response.data.id}`);
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      fetchFiles();
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus('Upload Failed!');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>File Upload & Processing Platform</h1>
        <p>Using Azure Table Storage</p>
        
        <div className="upload-section">
          <input id="fileInput" type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload File</button>
        </div>
        
        <div className="status">{uploadStatus}</div>

        <h2>File Status</h2>
        <div className="files-table">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Upload Time</th>
                <th>Status</th>
                <th>File Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.RowKey}>
                  <td>{file.filename}</td>
                  <td>{new Date(file.upload_time).toLocaleString()}</td>
                  <td className={`status-${file.status.toLowerCase()}`}>
                    {file.status}
                  </td>
                  <td>{file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>
    </div>
  );
}

export default App;
