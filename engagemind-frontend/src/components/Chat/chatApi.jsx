import axiosChat from '../../api/axiosChat';
import axiosFineTune from '../../api/axiosFineTune';

export async function fetchConversations() {
  try {
    const response = await axiosChat.get('/api/conversations');
    return response.data || []; // Return empty array if no data
  } catch (error) {
    console.error('Error fetching conversations:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
  }
}

export async function createConversation() {
  try {
    const response = await axiosChat.post('/api/conversation');
    return response.data; // { conversation_id: "..." }
  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to create conversation');
  }
}

export async function fetchConversationMessages(conversationId) {
  try {
    const response = await axiosChat.get(`/api/conversation/${conversationId}`);
    return response.data; // { messages: [...] }
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to fetch conversation messages');
  }
}

export async function sendMessage(conversationId, message) {
  try {
    // Reject local conversations - authentication required
    if (conversationId.startsWith('local_')) {
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    const response = await axiosChat.post(
      `/api/conversation/${conversationId}/message`,
      { message }
    );
    return response.data; // { answer: "..." }
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
}

export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosChat.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to upload documents.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to upload document');
  }
}

export async function deleteConversation(conversationId) {
  try {
    const response = await axiosChat.delete(`/api/conversation/${conversationId}`);
    return response.data; // { status: "Conversation deleted successfully" }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    
    // Check if it's an authentication error
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to use chat features.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to delete conversation');
  }
}

export async function startFineTuneTraining() {
  try {
    const response = await axiosFineTune.post('/api/fine-tune', {});
    return response.data;
  } catch (error) {
    console.error('Error starting fine-tuning:', error);

    if (error.response?.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to start training.');
    }

    throw new Error(error.response?.data?.message || 'Failed to start training');
  }
}

export async function fetchFineTuneStatus(taskId) {
  try {
    const response = await axiosFineTune.get(`/api/fine-tune/status/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fine-tune status:', error);

    if (error.response?.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in to check training status.');
    }

    throw new Error(error.response?.data?.message || 'Failed to fetch training status');
  }
}
