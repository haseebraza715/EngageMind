# EngageMind

EngageMind is an advanced AI-powered educational platform designed to enhance learning through interactive engagement and intelligent retrieval.

## 🏗 Project Structure

The project is divided into three main microservices:

- **📱 Frontend (`/engagemind-frontend`)**
  - Built with **React** and **TailwindCSS**.
  - Provides an interactive user interface for chat, document management, and user profiles.

- **🚀 Backend (`/engagemind-backend`)**
  - Built with **Node.js** and **Express**.
  - Handles authentication, user data, and API orchestration.

- **🧠 AI/RAG Engine (`/engagemind-rag`)**
  - Built with **Python** & **LangChain**.
  - Implements Retrieval-Augmented Generation (RAG) for answering queries based on uploaded documents.

## 🚀 Getting Started

### 1. Setup Environment Variables
Ensure you have `.env` files configured in each directory (`frontend`, `backend`, `rag`) based on the provided examples.

### 2. Run the Application
You can run each service independently:

```bash
# Frontend
cd engagemind-frontend
npm install
npm start

# Backend
cd engagemind-backend
npm install
npm start

# RAG Engine
cd engagemind-rag
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 📄 License
This project is part of a thesis research work.
