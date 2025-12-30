// Chat API – Handles all chat-related requests via axiosChat
import axiosChat from '../api/axiosChat';


export async function fetchConversations() {
  try {
    const response = await axiosChat.get('/api/conversations');
    return response.data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw new Error("Failed to fetch conversations");
  }
}


export async function createConversation() {
  try {
    const response = await axiosChat.post('/api/conversation');
    return response.data; // { conversation_id: "..." }
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
}


export async function fetchConversationMessages(conversationId) {
  try {
    const response = await axiosChat.get(`/api/conversation/${conversationId}`);
    return response.data; // { messages: [...] }
  } catch (error) {
    console.error("Error fetching messages for conversation:", error);
    throw new Error("Failed to fetch conversation messages");
  }
}

export async function sendMessage(conversationId, message) {
  try {
    const response = await axiosChat.post(
      `/api/conversation/${conversationId}/message`,
      { message }
    );
    return response.data; // { answer: "..." }
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}


export async function askQuestion(question) {
  try {
    const response = await axiosChat.post('/api/ask', { question });
    return response.data; // { answer: "..." }
  } catch (error) {
    console.error("Error asking question:", error);
    throw new Error("Failed to get answer");
  }
}


export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosChat.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error("Failed to upload document");
  }
}
