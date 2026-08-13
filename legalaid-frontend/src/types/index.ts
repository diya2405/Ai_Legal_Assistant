export interface Entity {
  label: string;
  value: string;
  confirmed_by_user?: boolean;
}

export interface IntakeResponse {
  intake_id: string;
  session_id: string;
  language: string | null;
  entities: Entity[];
  created_at: string;
  message?: string;
}

export interface ClassificationMatch {
  kb_id: string;
  domain: string;
  issue_type: string;
  confidence_score: number;
}

export interface ClassificationResponse {
  classification_id: string;
  intake_id: string;
  matches: ClassificationMatch[];
  message: string;
}

export interface CitationDetail {
  act_name: string;
  section_number: string;
  law_code: string;
  source_url?: string;
}

export interface LegalExplanationResponse {
  intake_id: string;
  explanation: string;
  rights_summary: string;
  citations: CitationDetail[];
  supporting_documents: string[];
  provider_used: string;
  hallucination_guarded: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  intake_id: string;
  reply: string;
  provider_used: string;
  hallucination_guarded: boolean;
}

export interface GenerateDocumentResponse {
  document_id: string;
  intake_id: string;
  session_id: string;
  tone: 'request' | 'formal';
  download_url: string;
  signed_url_token: string;
  generated_at: string;
}

export interface SessionResponse {
  session_id: string;
  token_hash: string;
  created_at: string;
}
