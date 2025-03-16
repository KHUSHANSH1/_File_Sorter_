// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const sortBtn = document.getElementById('sortBtn');
const modal = document.getElementById('sortedFilesModal');
const closeBtn = document.querySelector('.close-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const categoryContents = document.querySelectorAll('.category-content');
// Additional DOM elements
const fileSearch = document.getElementById('fileSearch');
const modalSearch = document.getElementById('modalSearch');
const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
const bulkDownloadModal = document.getElementById('bulkDownloadModal');
const closeBulkDownload = document.getElementById('closeBulkDownload');
const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
const fileDetailsModal = document.getElementById('fileDetailsModal');
const closeFileDetails = document.getElementById('closeFileDetails');
const fileDetailsContent = document.getElementById('fileDetailsContent');
const lightThemeBtn = document.getElementById('lightTheme');
const darkThemeBtn = document.getElementById('darkTheme');
const blueThemeBtn = document.getElementById('blueTheme');

// File Storage
let uploadedFiles = [];
let folderStructure = {}; // To store folder hierarchy if needed

// File Type Categories
const fileTypes = {
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'],
    videos: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    others: []
};

// File Type Icons
const fileIcons = {
    images: 'fa-image',
    documents: {
        pdf: 'fa-file-pdf',
        doc: 'fa-file-word',
        docx: 'fa-file-word',
        xls: 'fa-file-excel',
        xlsx: 'fa-file-excel',
        ppt: 'fa-file-powerpoint',
        pptx: 'fa-file-powerpoint',
        txt: 'fa-file-alt',
        default: 'fa-file-alt'
    },
    videos: 'fa-video',
    audio: 'fa-music',
    archives: 'fa-file-archive',
    others: 'fa-file'
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Hide stats panel if it exists in HTML
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) {
        statsPanel.style.display = 'none';
    }
    
    // Set file input to accept directories
    if (fileInput) {
        fileInput.setAttribute('webkitdirectory', '');
        fileInput.setAttribute('directory', '');
        fileInput.setAttribute('multiple', '');
    }
    
    // Drag and Drop Events
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());
    
    // File Input Change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Update dropZone text to include folders
    const dropZoneText = dropZone.querySelector('h2');
    if (dropZoneText) {
        dropZoneText.textContent = 'Drag & Drop Files or Folders Here';
    }
    
    // Sort Button
    sortBtn.addEventListener('click', sortFiles);
    
    // Modal Close
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            categoryContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            document.getElementById(category).classList.add('active');
        });
    });
    
    // File Search
    if (fileSearch) fileSearch.addEventListener('input', filterUploadedFiles);
    if (modalSearch) modalSearch.addEventListener('input', filterSortedFiles);
    
    // Bulk Download
    if (bulkDownloadBtn) bulkDownloadBtn.addEventListener('click', () => {
        if (bulkDownloadModal) bulkDownloadModal.style.display = 'block';
    });
    
    if (closeBulkDownload) closeBulkDownload.addEventListener('click', () => {
        if (bulkDownloadModal) bulkDownloadModal.style.display = 'none';
    });
    
    if (downloadSelectedBtn) downloadSelectedBtn.addEventListener('click', bulkDownloadFiles);
    
    // File Details Modal
    if (closeFileDetails) closeFileDetails.addEventListener('click', () => {
        if (fileDetailsModal) fileDetailsModal.style.display = 'none';
    });
    
    // Theme Switcher
    if (lightThemeBtn) lightThemeBtn.addEventListener('click', () => setTheme('light'));
    if (darkThemeBtn) darkThemeBtn.addEventListener('click', () => setTheme('dark'));
    if (blueThemeBtn) blueThemeBtn.addEventListener('click', () => setTheme('blue'));
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Window click events for modals
    window.addEventListener('click', (e) => {
        if (bulkDownloadModal && e.target === bulkDownloadModal) {
            bulkDownloadModal.style.display = 'none';
        }
        if (fileDetailsModal && e.target === fileDetailsModal) {
            fileDetailsModal.style.display = 'none';
        }
    });
});

// Handle Drag Over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
}

// Handle Drag Leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
}

// Handle Drop - Updated to handle folders
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    // Check if items property exists (for folder drop support)
    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access folders
        handleDropItems(e.dataTransfer.items);
    } else {
        // Fallback to regular files API
        const files = e.dataTransfer.files;
        handleFiles(files);
    }
}

// Handle Drop Items (for folder support)
function handleDropItems(items) {
    let filesProcessed = 0;
    let totalEntries = 0;
    let processedEntries = [];
    
    // Count total entries first for progress tracking
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            totalEntries++;
        }
    }
    
    // If there are no items, exit
    if (totalEntries === 0) return;
    
    // Show loading notification
    showNotification('Processing folders and files...', 'info');
    
    // Process each item (file or folder)
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : item.getAsEntry();
            
            if (entry) {
                if (entry.isFile) {
                    entry.file(file => {
                        processFileFromEntry(file, '', processedEntries);
                        filesProcessed++;
                        checkAllProcessed(filesProcessed, totalEntries);
                    });
                } else if (entry.isDirectory) {
                    // Process directory
                    processDirectory(entry, '', processedEntries, filesCount => {
                        totalEntries += filesCount - 1; // -1 because we already counted the directory itself
                    }, () => {
                        filesProcessed++;
                        checkAllProcessed(filesProcessed, totalEntries);
                    });
                }
            }
        }
    }
}

// Process directory recursively
function processDirectory(directoryEntry, path, processedEntries, updateTotalCallback, completionCallback) {
    const dirReader = directoryEntry.createReader();
    const folderPath = path ? path + '/' + directoryEntry.name : directoryEntry.name;
    let filesCount = 0;
    
    // Function to read directory entries in batches
    function readEntries() {
        dirReader.readEntries(entries => {
            if (entries.length === 0) {
                // No more entries, directory has been processed
                updateTotalCallback(filesCount);
                completionCallback();
            } else {
                filesCount += entries.length;
                
                // Process each entry
                entries.forEach(entry => {
                    if (entry.isFile) {
                        entry.file(file => {
                            processFileFromEntry(file, folderPath, processedEntries);
                        });
                    } else if (entry.isDirectory) {
                        // Recursively process subdirectories
                        processDirectory(entry, folderPath, processedEntries, count => {
                            filesCount += count;
                        }, () => {
                            // Subdirectory completion callback (do nothing here)
                        });
                    }
                });
                
                // Continue reading more entries (if any)
                readEntries();
            }
        }, error => {
            console.error('Error reading directory:', error);
            completionCallback();
        });
    }
    
    // Start reading directory entries
    readEntries();
}

// Process individual file from entry
function processFileFromEntry(file, folderPath, processedEntries) {
    // Create a full path for the file
    const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
    
    // Check if this file has already been processed
    if (processedEntries.includes(fullPath)) {
        return;
    }
    
    // Add to processed entries
    processedEntries.push(fullPath);
    
    // Check if file already exists in the list
    if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        // Skip notification for duplicates when processing folders (to avoid spam)
        return;
    }
    
    // Add folder path to file object for display
    file.folderPath = folderPath;
    
    // Add file to the list
    uploadedFiles.push(file);
    addFileToList(file);
}

// Check if all files and folders have been processed
function checkAllProcessed(processed, total) {
    if (processed >= total) {
        // Enable sort button if files are uploaded
        if (uploadedFiles.length > 0) {
            sortBtn.disabled = false;
        }
        
        showNotification(`Processed ${processed} items successfully!`, 'success');
    }
}

// Handle File Select - Modified for folder support
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    showNotification(`Processing ${files.length} items...`, 'info');
    
    // Process each file with its path
    let processedFiles = 0;
    Array.from(files).forEach(file => {
        // Extract relative path from webkitRelativePath (for folder upload)
        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
        // Remove the filename from the path
        pathParts.pop();
        // Join the remaining parts to form the folder path
        const folderPath = pathParts.join('/');
        
        // Check if file already exists in the list
        if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            // For folder upload, we'll skip the duplicate notification to avoid spam
            processedFiles++;
            if (processedFiles === files.length) {
                finishFileProcessing();
            }
            return;
        }
        
        // Add folder path to file object for display
        file.folderPath = folderPath;
        
        // Add file to uploadedFiles array and UI
        uploadedFiles.push(file);
        addFileToList(file);
        
        processedFiles++;
        if (processedFiles === files.length) {
            finishFileProcessing();
        }
    });
    
    // Reset file input to allow selecting the same folder again
    fileInput.value = '';
}

// Finish file processing
function finishFileProcessing() {
    // Enable sort button if files are uploaded
    if (uploadedFiles.length > 0) {
        sortBtn.disabled = false;
    }
    
    showNotification('Files processed successfully!', 'success');
}

// Add File to List - Updated to display folder path
function addFileToList(file) {
    const li = document.createElement('li');
    
    // Add folder path to display if available
    const folderPathHTML = file.folderPath ? 
        `<span class="folder-path">${file.folderPath}/</span>` : '';
    
    li.innerHTML = `
        <i class="fas ${getFileIcon(file)}"></i>
        <div class="file-info">
            ${folderPathHTML}
            <span class="file-name">${file.name}</span>
        </div>
        <span class="file-size">${formatFileSize(file.size)}</span>
        <i class="fas fa-info-circle view-details"></i>
        <i class="fas fa-times remove-file"></i>
    `;
    
    // Remove file event
    li.querySelector('.remove-file').addEventListener('click', () => {
        uploadedFiles = uploadedFiles.filter(f => f !== file);
        li.remove();
        
        // Disable sort button if no files
        if (uploadedFiles.length === 0) {
            sortBtn.disabled = true;
        }
    });
    
    // View file details event
    li.querySelector('.view-details').addEventListener('click', () => {
        showFileDetails(file);
    });
    
    fileList.appendChild(li);
    
    // Add animation
    setTimeout(() => {
        li.style.opacity = '1';
    }, 10);
}

// Get File Icon
function getFileIcon(file) {
    const extension = getFileExtension(file.name).toLowerCase();
    
    // Check file type
    for (const category in fileTypes) {
        if (fileTypes[category].includes(extension)) {
            if (category === 'documents' && fileIcons.documents[extension]) {
                return fileIcons.documents[extension];
            }
            return fileIcons[category];
        }
    }
    
    return fileIcons.others;
}

// Get File Extension
function getFileExtension(filename) {
    return filename.split('.').pop();
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sort Files
function sortFiles() {
    if (uploadedFiles.length === 0) {
        showNotification('No files to sort', 'warning');
        return;
    }
    
    // Clear previous sorted files
    document.getElementById('imagesGrid').innerHTML = '';
    document.getElementById('documentsList').innerHTML = '';
    document.getElementById('videosGrid').innerHTML = '';
    document.getElementById('audioList').innerHTML = '';
    document.getElementById('archivesList').innerHTML = '';
    document.getElementById('othersList').innerHTML = '';
    
    // Sort files by type
    const sortedFiles = {
        images: [],
        documents: [],
        videos: [],
        audio: [],
        archives: [],
        others: []
    };
    
    uploadedFiles.forEach(file => {
        const extension = getFileExtension(file.name).toLowerCase();
        let category = 'others';
        
        // Determine file category
        for (const type in fileTypes) {
            if (fileTypes[type].includes(extension)) {
                category = type;
                break;
            }
        }
        
        sortedFiles[category].push(file);
    });
    
    // Sort each category's files by folder path then by name
    for (const category in sortedFiles) {
        sortedFiles[category].sort((a, b) => {
            // First sort by folder path
            const folderA = a.folderPath || '';
            const folderB = b.folderPath || '';
            
            if (folderA !== folderB) {
                return folderA.localeCompare(folderB);
            }
            
            // Then sort by filename
            return a.name.localeCompare(b.name);
        });
    }
    
    // Display sorted files
    displaySortedFiles(sortedFiles);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add animation to modal content
    const modalContent = document.querySelector('.modal-content');
    modalContent.style.animation = 'none';
    setTimeout(() => {
        modalContent.style.animation = 'slideDown 0.5s ease';
    }, 10);
}

// Display Sorted Files
function displaySortedFiles(sortedFiles) {
    // Display Images
    const imagesGrid = document.getElementById('imagesGrid');
    sortedFiles.images.forEach(file => {
        const fileCard = createFileCard(file, true);
        imagesGrid.appendChild(fileCard);
    });
    
    // Display Documents
    const documentsList = document.getElementById('documentsList');
    sortedFiles.documents.forEach(file => {
        const fileItem = createFileItem(file);
        documentsList.appendChild(fileItem);
    });
    
    // Display Videos
    const videosGrid = document.getElementById('videosGrid');
    sortedFiles.videos.forEach(file => {
        const fileCard = createFileCard(file, true);
        videosGrid.appendChild(fileCard);
    });
    
    // Display Audio
    const audioList = document.getElementById('audioList');
    sortedFiles.audio.forEach(file => {
        const fileItem = createFileItem(file);
        audioList.appendChild(fileItem);
    });
    
    // Display Archives
    const archivesList = document.getElementById('archivesList');
    sortedFiles.archives.forEach(file => {
        const fileItem = createFileItem(file);
        archivesList.appendChild(fileItem);
    });
    
    // Display Others
    const othersList = document.getElementById('othersList');
    sortedFiles.others.forEach(file => {
        const fileItem = createFileItem(file);
        othersList.appendChild(fileItem);
    });
    
    // Update tab counts
    updateTabCounts(sortedFiles);
}

// Create File Card (Updated with detail view and preview for videos)
function createFileCard(file, showPreview = false) {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    
    if (showPreview) {
        if (file.type.startsWith('image/')) {
            // Create image preview
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = 'var(--border-radius)';
            img.style.marginBottom = '10px';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            fileCard.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            // Create video thumbnail with play icon
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'video-thumbnail';
            thumbnailContainer.style.position = 'relative';
            thumbnailContainer.style.width = '100%';
            thumbnailContainer.style.height = '100px';
            thumbnailContainer.style.backgroundColor = '#1a1a1a';
            thumbnailContainer.style.borderRadius = 'var(--border-radius)';
            thumbnailContainer.style.marginBottom = '10px';
            thumbnailContainer.style.display = 'flex';
            thumbnailContainer.style.justifyContent = 'center';
            thumbnailContainer.style.alignItems = 'center';
            
            const playIcon = document.createElement('i');
            playIcon.className = 'fas fa-play-circle';
            playIcon.style.fontSize = '2.5rem';
            playIcon.style.color = 'white';
            
            thumbnailContainer.appendChild(playIcon);
            fileCard.appendChild(thumbnailContainer);
        } else {
            // Show icon
            const icon = document.createElement('i');
            icon.className = `fas ${getFileIcon(file)}`;
            fileCard.appendChild(icon);
        }
    } else {
        // Show icon
        const icon = document.createElement('i');
        icon.className = `fas ${getFileIcon(file)}`;
        fileCard.appendChild(icon);
    }
    
    // Add folder path if it exists
    if (file.folderPath) {
        const folderPath = document.createElement('div');
        folderPath.className = 'folder-path';
        folderPath.innerHTML = `<i class="fas fa-folder folder-indicator"></i>${file.folderPath}`;
        fileCard.appendChild(folderPath);
    }
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(file.size);
    
    const actionBtns = document.createElement('div');
    actionBtns.className = 'file-actions';
    
    const detailsBtn = document.createElement('i');
    detailsBtn.className = 'fas fa-info-circle';
    detailsBtn.title = 'View Details';
    
    const downloadBtn = document.createElement('i');
    downloadBtn.className = 'fas fa-download';
    downloadBtn.title = 'Download File';
    
    actionBtns.appendChild(detailsBtn);
    actionBtns.appendChild(downloadBtn);
    
    fileCard.appendChild(fileName);
    fileCard.appendChild(fileSize);
    fileCard.appendChild(actionBtns);
    
    // Add click events to buttons
    detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showFileDetails(file);
    });
    
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFile(file);
    });
    
    // Add click event to entire card to view details
    fileCard.addEventListener('click', () => {
        showFileDetails(file);
    });
    
    return fileCard;
}

// Create File Item (Updated with detail view option)
function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const icon = document.createElement('i');
    icon.className = `fas ${getFileIcon(file)}`;
    
    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';
    
    // Add folder path if it exists
    if (file.folderPath) {
        const folderPath = document.createElement('div');
        folderPath.className = 'folder-path';
        folderPath.innerHTML = `<i class="fas fa-folder folder-indicator"></i>${file.folderPath}`;
        fileDetails.appendChild(folderPath);
    }
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(file.size);
    
    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);
    
    const actionBtns = document.createElement('div');
    actionBtns.className = 'file-actions';
    
    const detailsBtn = document.createElement('i');
    detailsBtn.className = 'fas fa-info-circle';
    detailsBtn.title = 'View Details';
    
    const downloadBtn = document.createElement('i');
    downloadBtn.className = 'fas fa-download';
    downloadBtn.title = 'Download File';
    
    actionBtns.appendChild(detailsBtn);
    actionBtns.appendChild(downloadBtn);
    
    fileItem.appendChild(icon);
    fileItem.appendChild(fileDetails);
    fileItem.appendChild(actionBtns);
    
    // Add click events to buttons
    detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showFileDetails(file);
    });
    
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFile(file);
    });
    
    // Add click event to entire item to view details
    fileItem.addEventListener('click', () => {
        showFileDetails(file);
    });
    
    return fileItem;
}

// Update Tab Counts
function updateTabCounts(sortedFiles) {
    tabBtns.forEach(btn => {
        const category = btn.getAttribute('data-category');
        const count = sortedFiles[category].length;
        
        // Update tab text with count
        btn.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} (${count})`;
    });
}

// Download File
function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add notification to body
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        display: flex;
        align-items: center;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    }
    
    .notification.success {
        border-left: 4px solid var(--success-color);
    }
    
    .notification.warning {
        border-left: 4px solid var(--warning-color);
    }
    
    .notification.info {
        border-left: 4px solid var(--info-color);
    }
    
    .notification i {
        margin-right: 10px;
        font-size: 1.2rem;
    }
    
    .notification.success i {
        color: var(--success-color);
    }
    
    .notification.warning i {
        color: var(--warning-color);
    }
    
    .notification.info i {
        color: var(--info-color);
    }
`;

document.head.appendChild(style);

// New Functions

// Filter Uploaded Files
function filterUploadedFiles() {
    const searchTerm = fileSearch.value.toLowerCase();
    const fileItems = fileList.querySelectorAll('li');
    
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        if (fileName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter Sorted Files
function filterSortedFiles() {
    const searchTerm = modalSearch.value.toLowerCase();
    
    // Get all file items in the modal
    const fileCards = document.querySelectorAll('.file-card');
    const fileItems = document.querySelectorAll('.file-item');
    
    // Filter file cards (grid view)
    fileCards.forEach(card => {
        const fileName = card.querySelector('.file-name').textContent.toLowerCase();
        if (fileName.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Filter file items (list view)
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        if (fileName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Bulk Download Files
function bulkDownloadFiles() {
    const selectedCategories = {
        images: document.getElementById('bulkImages').checked,
        documents: document.getElementById('bulkDocuments').checked,
        videos: document.getElementById('bulkVideos').checked,
        audio: document.getElementById('bulkAudio').checked,
        archives: document.getElementById('bulkArchives').checked,
        others: document.getElementById('bulkOthers').checked
    };
    
    // Filter files based on selected categories
    const filesToDownload = uploadedFiles.filter(file => {
        const extension = getFileExtension(file.name).toLowerCase();
        let category = 'others';
        
        // Determine file category
        for (const type in fileTypes) {
            if (fileTypes[type].includes(extension)) {
                category = type;
                break;
            }
        }
        
        return selectedCategories[category];
    });
    
    if (filesToDownload.length === 0) {
        showNotification('No files selected for download', 'warning');
        return;
    }
    
    if (filesToDownload.length === 1) {
        // If only one file, download directly
        downloadFile(filesToDownload[0]);
        bulkDownloadModal.style.display = 'none';
        return;
    }
    
    // For multiple files, create a zip
    createZipArchive(filesToDownload);
}

// Create ZIP Archive
function createZipArchive(files) {
    showNotification('Preparing files for download...', 'info');
    
    const zip = new JSZip();
    let processingCount = 0;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Add file to zip
            zip.file(file.name, e.target.result);
            processingCount++;
            
            // When all files are processed, generate the zip
            if (processingCount === files.length) {
                zip.generateAsync({type: 'blob'}).then(content => {
                    // Download the zip file
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'files.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showNotification('Files downloaded successfully!', 'success');
                    bulkDownloadModal.style.display = 'none';
                });
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Show File Details - Updated to show folder path
function showFileDetails(file) {
    // Create file details content
    fileDetailsContent.innerHTML = '';
    
    // Basic file info
    const basicInfo = document.createElement('div');
    basicInfo.className = 'file-basic-info';
    
    // File icon or preview
    const previewContainer = document.createElement('div');
    previewContainer.className = 'file-preview-container';
    
    if (file.type.startsWith('image/')) {
        // Image preview
        const img = document.createElement('img');
        img.className = 'file-preview-img';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        previewContainer.appendChild(img);
    } else {
        // File icon
        const icon = document.createElement('i');
        icon.className = `fas ${getFileIcon(file)} file-preview-icon`;
        previewContainer.appendChild(icon);
    }
    
    basicInfo.appendChild(previewContainer);
    
    // File info table
    const infoTable = document.createElement('table');
    infoTable.className = 'file-info-table';
    
    // Format date
    const lastModified = new Date(file.lastModified);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formattedDate = lastModified.toLocaleDateString(undefined, dateOptions);
    
    // Add file information rows
    const infoRows = [
        { label: 'Name', value: file.name },
        { label: 'Type', value: file.type || `${getFileExtension(file.name).toUpperCase()} File` },
        { label: 'Size', value: formatFileSize(file.size) },
        { label: 'Location', value: file.folderPath || 'Root' },
        { label: 'Last Modified', value: formattedDate }
    ];
    
    infoRows.forEach(row => {
        const tr = document.createElement('tr');
        
        const tdLabel = document.createElement('td');
        tdLabel.className = 'info-label';
        tdLabel.textContent = row.label;
        
        const tdValue = document.createElement('td');
        tdValue.className = 'info-value';
        tdValue.textContent = row.value;
        
        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        infoTable.appendChild(tr);
    });
    
    basicInfo.appendChild(infoTable);
    fileDetailsContent.appendChild(basicInfo);
    
    // Download button
    const downloadBtnContainer = document.createElement('div');
    downloadBtnContainer.className = 'details-download-container';
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'details-download-btn';
    downloadButton.innerHTML = '<i class="fas fa-download"></i> Download File';
    downloadButton.addEventListener('click', () => {
        downloadFile(file);
    });
    
    downloadBtnContainer.appendChild(downloadButton);
    fileDetailsContent.appendChild(downloadBtnContainer);
    
    // Show the modal
    fileDetailsModal.style.display = 'block';
}

// Set Theme
function setTheme(theme) {
    // Check if theme buttons exist
    if (!lightThemeBtn || !darkThemeBtn || !blueThemeBtn) {
        console.warn('Theme buttons not found in DOM');
        return;
    }

    // Debug log
    console.log('Setting theme to:', theme);
    
    // Remove active class from all theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected theme button
    switch (theme) {
        case 'dark':
            darkThemeBtn.classList.add('active');
            document.documentElement.setAttribute('data-theme', 'dark');
            // Also set a class on body for broader theme support
            document.body.className = 'dark-theme';
            break;
        case 'blue':
            blueThemeBtn.classList.add('active');
            document.documentElement.setAttribute('data-theme', 'blue');
            document.body.className = 'blue-theme';
            break;
        default:
            lightThemeBtn.classList.add('active');
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.className = 'light-theme';
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
}

// Add some CSS variables for themes if they don't exist
document.addEventListener('DOMContentLoaded', () => {
    // Add theme CSS if not already defined in style.css
    const themeStyle = document.createElement('style');
    themeStyle.textContent = `
        :root {
            --primary-color: #4CAF50;
            --secondary-color: #2196F3;
            --text-color: #333;
            --background-color: #f5f5f5;
            --card-background: #fff;
            --border-radius: 8px;
            --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            --success-color: #4CAF50;
            --warning-color: #FF9800;
            --info-color: #2196F3;
            --folder-color: #FFC107;
        }
        
        [data-theme="dark"] {
            --primary-color: #4CAF50;
            --secondary-color: #2196F3;
            --text-color: #f5f5f5;
            --background-color: #121212;
            --card-background: #1e1e1e;
            --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            --folder-color: #FFC107;
        }
        
        [data-theme="blue"] {
            --primary-color: #2196F3;
            --secondary-color: #4CAF50;
            --text-color: #f5f5f5;
            --background-color: #1a2a3a;
            --card-background: #2a3a4a;
            --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            --folder-color: #FFC107;
        }
        
        body {
            background-color: var(--background-color);
            color: var(--text-color);
            transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        .file-card, .file-item, .modal-content, .upload-area {
            background-color: var(--card-background);
            color: var(--text-color);
            transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        /* Hide any existing statistics elements */
        #statsPanel, 
        .stats-panel, 
        .stats-header, 
        .stats-content, 
        .stats-chart-container, 
        .stats-info, 
        .stat-item {
            display: none !important;
        }
        
        /* Folder path styling */
        .folder-path {
            color: var(--folder-color);
            font-size: 0.85em;
            display: block;
            opacity: 0.8;
            font-weight: 500;
        }
        
        .file-info {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* Folder view styles */
        .folder-indicator {
            margin-right: 5px;
            color: var(--folder-color);
        }
        
        /* Modified file list styles for folder support */
        #fileList li {
            display: flex;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        #fileList li i:first-child {
            margin-right: 15px;
            font-size: 1.2rem;
            min-width: 20px;
            text-align: center;
        }
        
        #fileList .file-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        #fileList .file-size {
            margin-left: auto;
            margin-right: 15px;
            color: rgba(var(--text-color-rgb, 0, 0, 0), 0.6);
            font-size: 0.9rem;
        }
        
        #fileList .view-details,
        #fileList .remove-file {
            cursor: pointer;
            margin-left: 10px;
            transition: color 0.2s ease;
        }
        
        #fileList .view-details:hover {
            color: var(--info-color);
        }
        
        #fileList .remove-file:hover {
            color: #f44336;
        }
    `;
    document.head.appendChild(themeStyle);
});

// Handle Files - For direct file drops (non-folder)
function handleFiles(files) {
    if (files.length === 0) return;
    
    showNotification(`Processing ${files.length} files...`, 'info');
    
    let processedFiles = 0;
    Array.from(files).forEach(file => {
        // Check if file already exists in the list
        if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            showNotification(`${file.name} is already in the list`, 'warning');
            processedFiles++;
            if (processedFiles === files.length) {
                finishFileProcessing();
            }
            return;
        }
        
        // Add file to the list
        uploadedFiles.push(file);
        addFileToList(file);
        
        processedFiles++;
        if (processedFiles === files.length) {
            finishFileProcessing();
        }
    });
    
    // Reset file input
    fileInput.value = '';
}
