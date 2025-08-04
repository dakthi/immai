export interface RAGSettings {
  threshold: number;
  maxResults: number;
  maxExcerpts: number;
  temperature: number;
  minThreshold: number;
}

export const defaultRAGSettings: RAGSettings = {
  threshold: 0.6,
  maxResults: 5,
  maxExcerpts: 3,
  temperature: 0.7,
  minThreshold: 0.35,
};

// For now, we'll use a simple in-memory store
// In production, this would be stored in database or Redis
let currentSettings: RAGSettings = { ...defaultRAGSettings };

export function getRAGSettings(): RAGSettings {
  return { ...currentSettings };
}

export function updateRAGSettings(newSettings: Partial<RAGSettings>): RAGSettings {
  currentSettings = { ...currentSettings, ...newSettings };
  console.log('🔧 [RAG-SETTINGS] Updated settings:', currentSettings);
  return { ...currentSettings };
}

export function resetRAGSettings(): RAGSettings {
  currentSettings = { ...defaultRAGSettings };
  console.log('🔄 [RAG-SETTINGS] Reset to defaults:', currentSettings);
  return { ...currentSettings };
}

// Load settings from environment variables if available
if (typeof process !== 'undefined' && process.env) {
  if (process.env.RAG_THRESHOLD) {
    currentSettings.threshold = parseFloat(process.env.RAG_THRESHOLD);
  }
  if (process.env.RAG_MAX_RESULTS) {
    currentSettings.maxResults = parseInt(process.env.RAG_MAX_RESULTS);
  }
  if (process.env.RAG_MAX_EXCERPTS) {
    currentSettings.maxExcerpts = parseInt(process.env.RAG_MAX_EXCERPTS);
  }
  if (process.env.RAG_TEMPERATURE) {
    currentSettings.temperature = parseFloat(process.env.RAG_TEMPERATURE);
  }
  if (process.env.RAG_MIN_THRESHOLD) {
    currentSettings.minThreshold = parseFloat(process.env.RAG_MIN_THRESHOLD);
  }
}