import axios from 'axios';
import type {
  SessionResponse,
  IntakeResponse,
  ClassificationResponse,
  LegalExplanationResponse,
  GenerateDocumentResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8002';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables HTTP-Only session cookies across domains
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for rate limit error handling (429)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      alert('⚠️ Rate Limit Exceeded: You have reached the maximum allowed requests (20/min). Please wait a moment before trying again.');
    }
    return Promise.reject(error);
  }
);

// API Service Wrapper
export const api = {
  // Session API
  createSession: async (): Promise<SessionResponse> => {
    const res = await apiClient.post('/api/session');
    return res.data;
  },
  getSession: async (): Promise<SessionResponse> => {
    const res = await apiClient.get('/api/session');
    return res.data;
  },

  // Intake API
  createIntake: async (raw_text: string, session_id?: string): Promise<IntakeResponse> => {
    const res = await apiClient.post('/api/intake', { raw_text, session_id });
    return res.data;
  },

  // Classification API
  classifyIntake: async (intake_id: string): Promise<ClassificationResponse> => {
    const res = await apiClient.post(`/api/intake/${intake_id}/classify`);
    return res.data;
  },

  // LLM Legal Explanation API
  explainIntake: async (intake_id: string): Promise<LegalExplanationResponse> => {
    const res = await apiClient.post(`/api/intake/${intake_id}/explain`);
    return res.data;
  },

  // Interactive Legal Q&A Chat API
  chatIntake: async (
    intake_id: string,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<{ intake_id: string; reply: string; provider_used: string; hallucination_guarded: boolean }> => {
    const res = await apiClient.post(`/api/intake/${intake_id}/chat`, { message, history });
    return res.data;
  },

  // PDF Document Generation API
  generateDocument: async (
    intake_id: string,
    payload: {
      tone: 'request' | 'formal';
      complainant_name?: string;
      complainant_address?: string;
      opponent_name?: string;
      opponent_address?: string;
      amount_claimed?: string;
    }
  ): Promise<GenerateDocumentResponse> => {
    const res = await apiClient.post(`/api/intake/${intake_id}/document`, payload);
    return res.data;
  },

  // PDF Download URL builder
  getDownloadUrl: (download_url_path: string): string => {
    if (download_url_path.startsWith('http')) return download_url_path;
    return `${API_BASE_URL}${download_url_path}`;
  }
};
