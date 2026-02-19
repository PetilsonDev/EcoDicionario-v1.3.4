
export interface DictionaryTerm {
  t: string; // Term
  d: string; // Definition
  c: string; // Category
  deleted_at?: string | null; // Soft delete timestamp
}

export interface BotKnowledgeItem {
  keywords: string[];
  answer: string;
}
