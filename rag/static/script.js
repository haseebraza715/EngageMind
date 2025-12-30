// TODO: Token should be obtained from authentication flow and stored in localStorage
// For development, set this to a valid JWT token from your auth system
const TOKEN = localStorage.getItem('auth_token') || prompt('Enter your JWT token:');

// DOM elements
const questionInput = document.getElementById("question");
const askButton = document.getElementById("ask-button");
const spinner = document.getElementById("loading-spinner");
const messageArea = document.getElementById("message-area");
const answerBox = document.getElementById("answer-box");

const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("upload-button");
const filenameDisplay = document.getElementById("filename-display");
const uploadSpinner = document.getElementById("upload-spinner");
const uploadMessage = document.getElementById("upload-message");
const documentList = document.getElementById("document-list");

// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Listen for the Enter key on question input
questionInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    askQuestion();
  }
});

// Ask a Question
async function askQuestion() {
  const question = questionInput.value.trim();
  clearMessage(messageArea);
  answerBox.textContent = "";

  if (!question) {
    showMessage(messageArea, "Please enter a question.", "error");
    questionInput.focus();
    return;
  }

  toggleLoading(spinner, true);
  askButton.disabled = true;
  questionInput.disabled = true;

  try {
    // Make a POST request to /api/ask
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${response.status} - ${text || "No response body"}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON, but received: ${text || "empty response"}`);
    }

    const data = await response.json();
    if (!data.answer) {
      throw new Error("No 'answer' field in JSON response.");
    }

    // Display the answer
    answerBox.textContent = data.answer;
  } catch (err) {
    console.error("Error:", err);
    showMessage(messageArea, `Error: ${err.message}`, "error");
  } finally {
    toggleLoading(spinner, false);
    askButton.disabled = false;
    questionInput.disabled = false;
  }
}

// Upload Files
uploadButton.addEventListener('click', uploadFiles);

async function uploadFiles() {
  clearMessage(uploadMessage);
  const files = fileInput.files;

  if (!files || files.length === 0) {
    showMessage(uploadMessage, "Please select at least one file before uploading.", "error");
    return;
  }

  // Validate files
  const validation = validateFiles(files);
  if (!validation.valid) {
    showMessage(uploadMessage, validation.message, "error");
    return;
  }

  toggleLoading(uploadSpinner, true);
  uploadButton.disabled = true;
  fileInput.disabled = true;

  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }

    // Make a POST request to /api/upload
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${response.status} - ${text || "No response body"}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON, but received: ${text || "empty response"}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    if (data.status) {
      showMessage(uploadMessage, data.status, "success");
    } else {
      showMessage(uploadMessage, "Upload completed, but no status message received.", "success");
    }

    // If the server returns a list of files, display them
    if (data.uploadedFiles) {
      updateDocumentList(data.uploadedFiles);
    }

    // Reset file input
    fileInput.value = "";
    filenameDisplay.textContent = "";
  } catch (err) {
    console.error("Upload error:", err);
    showMessage(uploadMessage, `Upload failed: ${err.message}`, "error");
  } finally {
    toggleLoading(uploadSpinner, false);
    uploadButton.disabled = false;
    fileInput.disabled = false;
  }
}

// Display file names and do basic checks
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    updateFileDisplay(fileInput.files);
  } else {
    filenameDisplay.textContent = "";
  }
});

function updateFileDisplay(files) {
  let fileNames = [];
  let sizeExceeded = false;
  let invalidType = false;
  const validTypes = [".txt", ".pdf", ".docx", ".md"];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    fileNames.push(file.name);

    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
    if (!isValidType) {
      invalidType = true;
    }

    // 10 MB limit per file
    if (file.size > 10 * 1024 * 1024) {
      sizeExceeded = true;
    }
  }

  filenameDisplay.innerHTML = `Selected: ${fileNames.join(", ")}`;

  if (invalidType) {
    filenameDisplay.innerHTML += `<br><span style="color: #f87171;">Warning: Some files have unsupported types.</span>`;
  }

  if (sizeExceeded) {
    filenameDisplay.innerHTML += `<br><span style="color: #f87171;">Warning: Some files exceed 10MB limit.</span>`;
  }
}

// Validate files before upload
function validateFiles(files) {
  const validTypes = [".txt", ".pdf", ".docx", ".md"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Check file type
    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
    if (!isValidType) {
      return {
        valid: false,
        message: `Invalid file type: ${file.name}. Only .txt, .pdf, .docx and .md files are supported.`
      };
    }
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        message: `File too large: ${file.name} (max 10MB allowed)`
      };
    }
  }
  return { valid: true };
}

// Display the document list
function updateDocumentList(files) {
  documentList.innerHTML = "";

  if (files.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No documents uploaded yet.";
    li.style.color = "#6b7280";
    li.style.fontStyle = "italic";
    documentList.appendChild(li);
    return;
  }

  files.forEach(file => {
    const li = document.createElement("li");
    li.style.marginBottom = "6px";
    li.style.paddingLeft = "10px";
    li.style.position = "relative";
    li.style.listStyle = "none";
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: -12px; top: 3px;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      ${file}
    `;
    documentList.appendChild(li);
  });
}

// Generic helpers
function toggleLoading(element, isLoading) {
  element.style.display = isLoading ? "block" : "none";
}
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}-message`;
}
function clearMessage(element) {
  element.textContent = "";
  element.className = "message";
}
